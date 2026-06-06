import { Router } from 'express';
import { query, queryOne } from '../db/client.js';
import { asyncHandler, badRequest, conflict, notFound } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';

export const dailyRouter = Router();
dailyRouter.use(requireAuth);

/**
 * Returns today's question id, assigning one if today has none yet.
 * Picks the oldest never-scheduled question deterministically.
 */
async function getOrAssignTodayQuestion(): Promise<{ id: string; prompt: string } | null> {
  const existing = await queryOne<{ id: string; prompt: string }>(
    `SELECT id, prompt FROM daily_questions WHERE active_date = CURRENT_DATE`
  );
  if (existing) return existing;

  // Assign one. ON CONFLICT guards against a race where two requests assign at once.
  const assigned = await queryOne<{ id: string; prompt: string }>(
    `UPDATE daily_questions
        SET active_date = CURRENT_DATE
      WHERE id = (
        SELECT id FROM daily_questions
        WHERE active_date IS NULL
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, prompt`
  );
  if (assigned) return assigned;

  // Fallback: another request assigned it in the meantime, or pool exhausted.
  return queryOne<{ id: string; prompt: string }>(
    `SELECT id, prompt FROM daily_questions WHERE active_date = CURRENT_DATE`
  );
}

// GET /daily/today ---------------------------------------------------------
// Returns the question + whether you've answered. Friends' answers are only
// included once you've posted yours (gating, DEC-P004).
dailyRouter.get(
  '/today',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const question = await getOrAssignTodayQuestion();
    if (!question) throw notFound('No question available today');

    const mine = await queryOne<{ id: string; body: string; created_at: string }>(
      `SELECT id, body, created_at FROM daily_answers
       WHERE question_id = $1 AND user_id = $2`,
      [question.id, me]
    );

    let friendsAnswers: unknown[] = [];
    if (mine) {
      // Only accepted friends' answers to the SAME question, newest first.
      friendsAnswers = await query(
        `SELECT da.id, da.body, da.created_at,
                u.id AS user_id, u.display_name, u.avatar_emoji, u.avatar_config
         FROM daily_answers da
         JOIN users u ON u.id = da.user_id
         JOIN friendships f
           ON f.status = 'accepted'
          AND ((f.user_a_id = $2 AND f.user_b_id = da.user_id)
            OR (f.user_b_id = $2 AND f.user_a_id = da.user_id))
         WHERE da.question_id = $1
         ORDER BY da.created_at DESC`,
        [question.id, me]
      );
    }

    res.json({
      question: { id: question.id, prompt: question.prompt },
      answered: Boolean(mine),
      myAnswer: mine
        ? { id: mine.id, body: mine.body, createdAt: mine.created_at }
        : null,
      friendsAnswers, // empty until you post
    });
  })
);

// POST /daily/answer  { body } ---------------------------------------------
// No update endpoint exists — answers are uneditable (DEC-P003).
dailyRouter.post(
  '/answer',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const body = String(req.body?.body ?? '').trim();
    if (!body) throw badRequest('body is required');
    if (body.length > 500) throw badRequest('Answer must be 500 characters or fewer');

    const question = await getOrAssignTodayQuestion();
    if (!question) throw notFound('No question available today');

    const already = await queryOne<{ id: string }>(
      `SELECT id FROM daily_answers WHERE question_id = $1 AND user_id = $2`,
      [question.id, me]
    );
    if (already) throw conflict('You already answered today — answers cannot be edited');

    const created = await queryOne<{ id: string; created_at: string }>(
      `INSERT INTO daily_answers (question_id, user_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [question.id, me, body]
    );
    res.status(201).json({
      id: created?.id,
      body,
      createdAt: created?.created_at,
    });
  })
);

// GET /daily/history -------------------------------------------------------
// The current user's own past answers (Profile timeline, OPEN-002).
dailyRouter.get(
  '/history',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const rows = await query(
      `SELECT da.id, da.body, da.created_at, dq.prompt
       FROM daily_answers da
       JOIN daily_questions dq ON dq.id = da.question_id
       WHERE da.user_id = $1
       ORDER BY da.created_at DESC
       LIMIT 100`,
      [me]
    );
    res.json({ history: rows });
  })
);
