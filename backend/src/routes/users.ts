import { Router } from 'express';
import { queryOne, query } from '../db/client.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import {
  publicUser,
  userCard,
  sanitizeAvatar,
  type UserRow,
} from '../lib/userShape.js';

export const usersRouter = Router();
usersRouter.use(requireAuth);

// GET /users/me ------------------------------------------------------------
usersRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await queryOne<UserRow>(`SELECT * FROM users WHERE id = $1`, [req.userId]);
    if (!user) throw notFound('User not found');

    const stats = await queryOne<{ friends: string; answers: string }>(
      `SELECT
         (SELECT count(*) FROM friendships
            WHERE status = 'accepted' AND (user_a_id = $1 OR user_b_id = $1)) AS friends,
         (SELECT count(*) FROM daily_answers WHERE user_id = $1) AS answers`,
      [req.userId]
    );

    res.json({
      user: publicUser(user),
      stats: {
        friends: Number(stats?.friends ?? 0),
        answers: Number(stats?.answers ?? 0),
      },
    });
  })
);

// PATCH /users/me  { displayName?, bio?, city?, avatar?, isPrivate? } -------
usersRouter.patch(
  '/me',
  asyncHandler(async (req, res) => {
    const { displayName, bio, city, avatar, isPrivate, companionType, username, hideLocation } =
      req.body ?? {};
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (username !== undefined) {
      const uname = String(username).trim();
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname)) {
        throw badRequest('Username must be 3–20 letters, numbers, or underscores');
      }
      const taken = await queryOne<{ id: string }>(
        `SELECT id FROM users WHERE lower(username) = lower($1) AND id <> $2`,
        [uname, req.userId]
      );
      if (taken) throw badRequest('That username is taken');
      fields.push(`username = $${i++}`);
      values.push(uname);
    }
    if (hideLocation !== undefined) {
      fields.push(`hide_location = $${i++}`);
      values.push(Boolean(hideLocation));
    }
    if (displayName !== undefined) {
      if (!String(displayName).trim()) throw badRequest('displayName cannot be empty');
      fields.push(`display_name = $${i++}`);
      values.push(displayName);
    }
    if (bio !== undefined) {
      fields.push(`bio = $${i++}`);
      values.push(bio);
    }
    if (city !== undefined) {
      fields.push(`city = $${i++}`);
      values.push(city);
    }
    if (avatar !== undefined) {
      fields.push(`avatar_config = $${i++}`);
      values.push(JSON.stringify(sanitizeAvatar(avatar)));
    }
    if (isPrivate !== undefined) {
      fields.push(`is_private = $${i++}`);
      values.push(Boolean(isPrivate));
    }
    if (companionType !== undefined) {
      if (companionType !== 'plant' && companionType !== 'creature') {
        throw badRequest('companionType must be plant or creature');
      }
      fields.push(`companion_type = $${i++}`);
      values.push(companionType);
    }
    if (fields.length === 0) throw badRequest('No fields to update');

    values.push(req.userId);
    const user = await queryOne<UserRow>(
      `UPDATE users SET ${fields.join(', ')}, updated_at = now()
       WHERE id = $${i} RETURNING *`,
      values
    );
    if (!user) throw notFound('User not found');
    res.json({ user: publicUser(user) });
  })
);

// GET /users/search?q= -----------------------------------------------------
// Private accounts still appear in search (per the chosen privacy model:
// "private = follow needs approval"). Returns avatar so results show the face.
usersRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 2) return res.json({ users: [] });
    const rows = await query<UserRow>(
      `SELECT * FROM users
       WHERE (lower(username) LIKE lower($1) OR lower(display_name) LIKE lower($1))
         AND id <> $2
       ORDER BY display_name
       LIMIT 15`,
      [`%${q}%`, req.userId]
    );
    res.json({ users: rows.map(userCard) });
  })
);
