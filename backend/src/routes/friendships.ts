import { Router } from 'express';
import { query, queryOne, execute } from '../db/client.js';
import { asyncHandler, badRequest, notFound, conflict } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { healthFromDays, daysSince } from '../lib/health.js';

export const friendshipsRouter = Router();
friendshipsRouter.use(requireAuth);

interface FriendshipRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  requested_by: string;
  status: string;
  last_contact_at: string | null;
  friend_id: string;
  friend_username: string;
  friend_display_name: string;
  friend_avatar_emoji: string;
}

// Order a pair so user_a_id < user_b_id (matches the table CHECK constraint).
function orderPair(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x];
}

function shapeFriendship(row: FriendshipRow) {
  const days = daysSince(row.last_contact_at);
  const { state, stemColor } = healthFromDays(days);
  return {
    id: row.id,
    status: row.status,
    requestedByMe: false, // filled by caller where relevant
    lastContactAt: row.last_contact_at,
    daysSinceContact: days,
    health: state,
    stemColor,
    friend: {
      id: row.friend_id,
      username: row.friend_username,
      displayName: row.friend_display_name,
      avatarEmoji: row.friend_avatar_emoji,
    },
  };
}

// Shared SELECT that resolves "the other person" relative to :me.
const SELECT_FRIENDSHIPS = `
  SELECT f.id, f.user_a_id, f.user_b_id, f.requested_by, f.status, f.last_contact_at,
         u.id          AS friend_id,
         u.username    AS friend_username,
         u.display_name AS friend_display_name,
         u.avatar_emoji AS friend_avatar_emoji
  FROM friendships f
  JOIN users u
    ON u.id = CASE WHEN f.user_a_id = $1 THEN f.user_b_id ELSE f.user_a_id END
  WHERE (f.user_a_id = $1 OR f.user_b_id = $1)
`;

// GET /friendships ---------------------------------------------------------
friendshipsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const rows = await query<FriendshipRow & { requested_by: string }>(
      `${SELECT_FRIENDSHIPS} AND f.status = 'accepted'
       ORDER BY f.last_contact_at ASC NULLS FIRST`,
      [me]
    );
    res.json({ friendships: rows.map(shapeFriendship) });
  })
);

// GET /friendships/pending -------------------------------------------------
friendshipsRouter.get(
  '/pending',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const rows = await query<FriendshipRow>(
      `${SELECT_FRIENDSHIPS} AND f.status = 'pending' AND f.requested_by <> $1
       ORDER BY f.created_at DESC`,
      [me]
    );
    res.json({ pending: rows.map(shapeFriendship) });
  })
);

// GET /friendships/:id -----------------------------------------------------
friendshipsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const row = await queryOne<FriendshipRow>(
      `${SELECT_FRIENDSHIPS} AND f.id = $2`,
      [me, req.params.id]
    );
    if (!row) throw notFound('Friendship not found');

    const history = await query(
      `SELECT id, kind, note, occurred_at
       FROM contact_events
       WHERE friendship_id = $1
       ORDER BY occurred_at DESC
       LIMIT 50`,
      [req.params.id]
    );

    res.json({ friendship: { ...shapeFriendship(row), history } });
  })
);

// POST /friendships/invite  { username } -----------------------------------
friendshipsRouter.post(
  '/invite',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const { username } = req.body ?? {};
    if (!username) throw badRequest('username is required');

    const target = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE lower(username) = lower($1)`,
      [username]
    );
    if (!target) throw notFound('No user with that username');
    if (target.id === me) throw badRequest('You cannot add yourself');

    const [a, b] = orderPair(me, target.id);
    const existing = await queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM friendships WHERE user_a_id = $1 AND user_b_id = $2`,
      [a, b]
    );
    if (existing) {
      throw conflict(
        existing.status === 'accepted' ? 'Already friends' : 'Invite already pending'
      );
    }

    const created = await queryOne<{ id: string }>(
      `INSERT INTO friendships (user_a_id, user_b_id, requested_by, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [a, b, me]
    );
    res.status(201).json({ id: created?.id, status: 'pending' });
  })
);

// POST /friendships/:id/accept ---------------------------------------------
friendshipsRouter.post(
  '/:id/accept',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    // Only the invited party (not the requester) may accept.
    const fr = await queryOne<{ id: string; requested_by: string }>(
      `SELECT id, requested_by FROM friendships
       WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2) AND status = 'pending'`,
      [req.params.id, me]
    );
    if (!fr) throw notFound('No pending invite found');
    if (fr.requested_by === me) throw badRequest('You sent this invite; wait for them to accept');

    await execute(
      `UPDATE friendships
       SET status = 'accepted', last_contact_at = COALESCE(last_contact_at, now()), updated_at = now()
       WHERE id = $1`,
      [req.params.id]
    );
    res.json({ id: req.params.id, status: 'accepted' });
  })
);

// POST /friendships/:id/contact  { note?, occurredAt? } --------------------
// "We just hung out" — updates last_contact_at and logs an event.
friendshipsRouter.post(
  '/:id/contact',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const { note, occurredAt } = req.body ?? {};
    const fr = await queryOne<{ id: string }>(
      `SELECT id FROM friendships
       WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2) AND status = 'accepted'`,
      [req.params.id, me]
    );
    if (!fr) throw notFound('Friendship not found');

    const when = occurredAt ? new Date(occurredAt) : new Date();
    await execute(
      `UPDATE friendships SET last_contact_at = $2, updated_at = now() WHERE id = $1`,
      [req.params.id, when]
    );
    await execute(
      `INSERT INTO contact_events (friendship_id, logged_by, kind, note, occurred_at)
       VALUES ($1, $2, 'hangout', $3, $4)`,
      [req.params.id, me, note ?? null, when]
    );

    const row = await queryOne<FriendshipRow>(`${SELECT_FRIENDSHIPS} AND f.id = $2`, [
      me,
      req.params.id,
    ]);
    res.json({ friendship: row ? shapeFriendship(row) : null });
  })
);

// POST /friendships/:id/miss-you -------------------------------------------
friendshipsRouter.post(
  '/:id/miss-you',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const fr = await queryOne<{ id: string; user_a_id: string; user_b_id: string }>(
      `SELECT id, user_a_id, user_b_id FROM friendships
       WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2) AND status = 'accepted'`,
      [req.params.id, me]
    );
    if (!fr) throw notFound('Friendship not found');

    const recipient = fr.user_a_id === me ? fr.user_b_id : fr.user_a_id;
    await execute(
      `INSERT INTO miss_you_signals (friendship_id, sender_id, recipient_id)
       VALUES ($1, $2, $3)`,
      [req.params.id, me, recipient]
    );
    await execute(
      `INSERT INTO contact_events (friendship_id, logged_by, kind)
       VALUES ($1, $2, 'miss_you')`,
      [req.params.id, me]
    );
    res.status(201).json({ ok: true });
  })
);
