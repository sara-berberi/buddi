import { query, queryOne } from '../db/client.js';

/** IDs of a user's accepted friends. */
export async function friendIds(userId: string): Promise<string[]> {
  const rows = await query<{ other_id: string }>(
    `SELECT CASE WHEN user_a_id = $1 THEN user_b_id ELSE user_a_id END AS other_id
     FROM friendships
     WHERE status = 'accepted' AND (user_a_id = $1 OR user_b_id = $1)`,
    [userId]
  );
  return rows.map((r) => r.other_id);
}

/** True if a and b are accepted friends. */
export async function areFriends(a: string, b: string): Promise<boolean> {
  if (a === b) return true;
  const [lo, hi] = a < b ? [a, b] : [b, a];
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM friendships
     WHERE status = 'accepted' AND user_a_id = $1 AND user_b_id = $2`,
    [lo, hi]
  );
  return Boolean(row);
}

/** Get or create the DM thread between two friends; returns thread id. */
export async function ensureThread(a: string, b: string): Promise<string> {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM dm_threads WHERE user_a_id = $1 AND user_b_id = $2`,
    [lo, hi]
  );
  if (existing) return existing.id;
  const created = await queryOne<{ id: string }>(
    `INSERT INTO dm_threads (user_a_id, user_b_id) VALUES ($1, $2)
     ON CONFLICT (user_a_id, user_b_id) DO UPDATE SET user_a_id = EXCLUDED.user_a_id
     RETURNING id`,
    [lo, hi]
  );
  return created!.id;
}
