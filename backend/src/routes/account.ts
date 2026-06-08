import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { queryOne, execute } from '../db/client.js';
import { asyncHandler, badRequest } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { hashToken } from '../lib/jwt.js';
import { config } from '../config.js';
import {
  sendEmail,
  verifyEmailTemplate,
  resetPasswordTemplate,
} from '../lib/email.js';

export const accountRouter = Router();

const HOUR = 3600_000;

// Create a one-time token, store its hash, return the raw token.
async function makeToken(table: string, userId: string, ttlMs: number): Promise<string> {
  const raw = crypto.randomBytes(32).toString('hex');
  await execute(
    `INSERT INTO ${table} (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(raw), new Date(Date.now() + ttlMs)]
  );
  return raw;
}

// Sends a verification email for a user (called on register + resend).
export async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  const raw = await makeToken('email_verification_tokens', userId, 24 * HOUR);
  const link = `${config.appUrl}/auth/verify?token=${raw}`;
  const tpl = verifyEmailTemplate(link);
  await sendEmail({ to: email, ...tpl });
}

// POST /account/verify  { token } — confirm email (soft; no auth needed) -----
accountRouter.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const token = String(req.body?.token ?? '');
    if (!token) throw badRequest('token is required');
    const row = await queryOne<{ id: string; user_id: string; expires_at: string; used: boolean }>(
      `SELECT id, user_id, expires_at, used FROM email_verification_tokens WHERE token_hash = $1`,
      [hashToken(token)]
    );
    if (!row || row.used || new Date(row.expires_at) < new Date()) {
      throw badRequest('Invalid or expired link');
    }
    await execute(`UPDATE email_verification_tokens SET used = TRUE WHERE id = $1`, [row.id]);
    await execute(`UPDATE users SET email_verified = TRUE WHERE id = $1`, [row.user_id]);
    res.json({ ok: true });
  })
);

// POST /account/resend-verification — re-send to the logged-in user ----------
accountRouter.post(
  '/resend-verification',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await queryOne<{ email: string; email_verified: boolean }>(
      `SELECT email, email_verified FROM users WHERE id = $1`,
      [req.userId]
    );
    if (user && !user.email_verified) {
      await sendVerificationEmail(req.userId!, user.email);
    }
    res.json({ ok: true });
  })
);

// POST /account/forgot-password  { email } — always returns ok ---------------
accountRouter.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email ?? '').trim();
    if (!email) throw badRequest('email is required');
    const user = await queryOne<{ id: string; email: string }>(
      `SELECT id, email FROM users WHERE lower(email) = lower($1)`,
      [email]
    );
    // Don't reveal whether the email exists.
    if (user) {
      const raw = await makeToken('password_reset_tokens', user.id, 1 * HOUR);
      const link = `${config.appUrl}/auth/reset?token=${raw}`;
      const tpl = resetPasswordTemplate(link);
      await sendEmail({ to: user.email, ...tpl });
    }
    res.json({ ok: true });
  })
);

// POST /account/reset-password  { token, password } --------------------------
accountRouter.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const token = String(req.body?.token ?? '');
    const password = String(req.body?.password ?? '');
    if (!token || !password) throw badRequest('token and password are required');
    if (password.length < 8) throw badRequest('Password must be at least 8 characters');

    const row = await queryOne<{ id: string; user_id: string; expires_at: string; used: boolean }>(
      `SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token_hash = $1`,
      [hashToken(token)]
    );
    if (!row || row.used || new Date(row.expires_at) < new Date()) {
      throw badRequest('Invalid or expired link');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await execute(`UPDATE users SET password_hash = $2 WHERE id = $1`, [row.user_id, passwordHash]);
    await execute(`UPDATE password_reset_tokens SET used = TRUE WHERE id = $1`, [row.id]);
    // Invalidate existing sessions by revoking refresh tokens.
    await execute(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [row.user_id]);
    res.json({ ok: true });
  })
);
