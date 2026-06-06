import { Router } from 'express';
import { query, queryOne, execute } from '../db/client.js';
import { asyncHandler, badRequest, notFound, conflict } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { areFriends, ensureThread } from '../lib/friends.js';
import { DEFAULT_AVATAR } from '../lib/userShape.js';

export const dmRouter = Router();
dmRouter.use(requireAuth);

// Confirm the thread belongs to me and return the other participant id.
async function threadOther(threadId: string, me: string): Promise<string> {
  const t = await queryOne<{ user_a_id: string; user_b_id: string }>(
    `SELECT user_a_id, user_b_id FROM dm_threads WHERE id = $1`,
    [threadId]
  );
  if (!t || (t.user_a_id !== me && t.user_b_id !== me)) throw notFound('Thread not found');
  return t.user_a_id === me ? t.user_b_id : t.user_a_id;
}

// GET /dm/threads — inbox list with the other person + last message ----------
dmRouter.get(
  '/threads',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const rows = await query(
      `SELECT t.id, t.last_message_at,
              u.id AS other_id, u.username, u.display_name, u.avatar_config,
              (SELECT body FROM dm_messages m WHERE m.thread_id = t.id
                 ORDER BY m.created_at DESC LIMIT 1) AS last_body,
              (SELECT share_kind FROM dm_messages m WHERE m.thread_id = t.id
                 ORDER BY m.created_at DESC LIMIT 1) AS last_share
       FROM dm_threads t
       JOIN users u ON u.id = CASE WHEN t.user_a_id = $1 THEN t.user_b_id ELSE t.user_a_id END
       WHERE t.user_a_id = $1 OR t.user_b_id = $1
       ORDER BY t.last_message_at DESC NULLS LAST`,
      [me]
    );
    res.json({
      threads: rows.map((r: any) => ({
        id: r.id,
        lastMessageAt: r.last_message_at,
        preview: r.last_body ?? (r.last_share ? `Shared a ${r.last_share}` : 'Say hi 👋'),
        friend: {
          id: r.other_id,
          username: r.username,
          displayName: r.display_name,
          avatar: r.avatar_config ?? DEFAULT_AVATAR,
        },
      })),
    });
  })
);

// POST /dm/with/:userId — get or create a thread with a friend ---------------
dmRouter.post(
  '/with/:userId',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const other = req.params.userId;
    if (other === me) throw badRequest('Cannot DM yourself');
    if (!(await areFriends(me, other))) throw conflict('You can only DM friends');
    const threadId = await ensureThread(me, other);
    res.json({ threadId });
  })
);

const MESSAGE_SELECT = `
  SELECT m.id, m.thread_id, m.sender_id, m.body, m.created_at,
         m.share_kind, m.share_post_id, m.share_venue_id,
         p.body AS post_body,
         pa.display_name AS post_author_name,
         v.name AS venue_name, v.neighborhood AS venue_neighborhood, v.category AS venue_category
  FROM dm_messages m
  LEFT JOIN posts p ON p.id = m.share_post_id
  LEFT JOIN users pa ON pa.id = p.author_id
  LEFT JOIN venues v ON v.id = m.share_venue_id
`;

function shapeMessage(r: any) {
  let share = null;
  if (r.share_kind === 'post' && r.share_post_id) {
    share = { kind: 'post', postId: r.share_post_id, postBody: r.post_body, postAuthor: r.post_author_name };
  } else if (r.share_kind === 'venue' && r.share_venue_id) {
    share = {
      kind: 'venue',
      venueId: r.share_venue_id,
      venueName: r.venue_name,
      neighborhood: r.venue_neighborhood,
      category: r.venue_category,
    };
  }
  return {
    id: r.id,
    senderId: r.sender_id,
    body: r.body,
    createdAt: r.created_at,
    share,
  };
}

// GET /dm/:threadId/messages?after=ISO — list (poll with ?after) -------------
dmRouter.get(
  '/:threadId/messages',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    await threadOther(req.params.threadId, me); // authorize
    const after = req.query.after ? String(req.query.after) : null;
    const rows = await query(
      `${MESSAGE_SELECT}
       WHERE m.thread_id = $1 AND ($2::timestamptz IS NULL OR m.created_at > $2)
       ORDER BY m.created_at ASC
       LIMIT 200`,
      [req.params.threadId, after]
    );
    res.json({ messages: rows.map(shapeMessage) });
  })
);

// POST /dm/:threadId/messages  { body?, share? } ----------------------------
// share = { kind:'post', postId } | { kind:'venue', venueId }
dmRouter.post(
  '/:threadId/messages',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    await threadOther(req.params.threadId, me); // authorize
    const body = req.body?.body ? String(req.body.body).trim() : null;
    const share = req.body?.share ?? null;

    if (!body && !share) throw badRequest('Message needs text or a share');
    if (body && body.length > 1000) throw badRequest('Message too long');

    let shareKind: string | null = null;
    let postId: string | null = null;
    let venueId: string | null = null;
    if (share) {
      if (share.kind === 'post' && share.postId) {
        shareKind = 'post';
        postId = String(share.postId);
      } else if (share.kind === 'venue' && share.venueId) {
        shareKind = 'venue';
        venueId = String(share.venueId);
      } else {
        throw badRequest('Invalid share');
      }
    }

    const created = await queryOne<{ id: string }>(
      `INSERT INTO dm_messages (thread_id, sender_id, body, share_kind, share_post_id, share_venue_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.params.threadId, me, body, shareKind, postId, venueId]
    );
    await execute(`UPDATE dm_threads SET last_message_at = now() WHERE id = $1`, [
      req.params.threadId,
    ]);
    const row = await queryOne(`${MESSAGE_SELECT} WHERE m.id = $1`, [created!.id]);
    res.status(201).json({ message: shapeMessage(row) });
  })
);
