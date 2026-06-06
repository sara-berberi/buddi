import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, execute } from '../db/client.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  refreshExpiry,
} from '../lib/jwt.js';
import { asyncHandler, badRequest, unauthorized, conflict } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

interface UserRow {
  id: string;
  username: string;
  email: string;
  display_name: string;
  bio: string | null;
  city: string;
  avatar_emoji: string;
  onboarded: boolean;
  password_hash?: string;
}

function publicUser(u: UserRow) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    displayName: u.display_name,
    bio: u.bio,
    city: u.city,
    avatarEmoji: u.avatar_emoji,
    onboarded: u.onboarded,
  };
}

async function issueTokens(userId: string) {
  const access = signAccessToken(userId);
  const { raw, hash } = generateRefreshToken();
  await execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hash, refreshExpiry()]
  );
  return { accessToken: access, refreshToken: raw };
}

// POST /auth/register ------------------------------------------------------
authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { username, email, password, displayName, city } = req.body ?? {};
    if (!username || !email || !password || !displayName) {
      throw badRequest('username, email, password, displayName are required');
    }
    if (String(password).length < 8) {
      throw badRequest('Password must be at least 8 characters');
    }

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($2)`,
      [username, email]
    );
    if (existing) throw conflict('Username or email already taken');

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await queryOne<UserRow>(
      `INSERT INTO users (username, email, password_hash, display_name, city)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'Tirana'))
       RETURNING *`,
      [username, email, passwordHash, displayName, city ?? null]
    );
    if (!user) throw badRequest('Could not create user');

    const tokens = await issueTokens(user.id);
    res.status(201).json({ user: publicUser(user), ...tokens });
  })
);

// POST /auth/login ---------------------------------------------------------
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { emailOrUsername, password } = req.body ?? {};
    if (!emailOrUsername || !password) {
      throw badRequest('emailOrUsername and password are required');
    }
    const user = await queryOne<UserRow>(
      `SELECT * FROM users
       WHERE lower(email) = lower($1) OR lower(username) = lower($1)`,
      [emailOrUsername]
    );
    if (!user || !user.password_hash) throw unauthorized('Invalid credentials');

    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) throw unauthorized('Invalid credentials');

    const tokens = await issueTokens(user.id);
    res.json({ user: publicUser(user), ...tokens });
  })
);

// POST /auth/refresh -------------------------------------------------------
authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) throw badRequest('refreshToken is required');

    const hash = hashToken(String(refreshToken));
    const row = await queryOne<{ id: string; user_id: string; expires_at: string; revoked: boolean }>(
      `SELECT id, user_id, expires_at, revoked FROM refresh_tokens WHERE token_hash = $1`,
      [hash]
    );
    if (!row || row.revoked || new Date(row.expires_at) < new Date()) {
      throw unauthorized('Invalid refresh token');
    }

    // Rotate: revoke the old token, issue a new pair.
    await execute(`UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`, [row.id]);
    const tokens = await issueTokens(row.user_id);
    res.json(tokens);
  })
);

// POST /auth/logout --------------------------------------------------------
authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body ?? {};
    if (refreshToken) {
      await execute(`UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`, [
        hashToken(String(refreshToken)),
      ]);
    }
    res.status(204).end();
  })
);

// POST /auth/onboarding ----------------------------------------------------
authRouter.post(
  '/onboarding',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const { answers } = req.body ?? {};
    if (!Array.isArray(answers) || answers.length === 0) {
      throw badRequest('answers must be a non-empty array of {questionKey, answer}');
    }
    for (const a of answers) {
      if (!a?.questionKey || typeof a.answer !== 'string') {
        throw badRequest('each answer needs questionKey and answer');
      }
      await execute(
        `INSERT INTO onboarding_answers (user_id, question_key, answer)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, question_key) DO UPDATE SET answer = EXCLUDED.answer`,
        [userId, a.questionKey, a.answer]
      );
    }
    await execute(`UPDATE users SET onboarded = TRUE, updated_at = now() WHERE id = $1`, [
      userId,
    ]);
    const user = await queryOne<UserRow>(`SELECT * FROM users WHERE id = $1`, [userId]);
    res.json({ user: user ? publicUser(user) : null });
  })
);

// GET /auth/me -------------------------------------------------------------
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await queryOne<UserRow>(`SELECT * FROM users WHERE id = $1`, [req.userId]);
    if (!user) throw unauthorized();
    res.json({ user: publicUser(user) });
  })
);
