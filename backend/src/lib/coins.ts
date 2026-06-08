import { withTransaction } from '../db/client.js';

export const QUEST_REWARD = 20; // buddis earned per quest "Let's go"

/** Add (or subtract) coins and record a ledger row, atomically. Returns balance. */
export async function adjustCoins(
  userId: string,
  delta: number,
  reason: string,
  venueId?: string
): Promise<number> {
  return withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE users SET coins = coins + $2 WHERE id = $1 RETURNING coins`,
      [userId, delta]
    );
    await client.query(
      `INSERT INTO coin_ledger (user_id, delta, reason, venue_id) VALUES ($1, $2, $3, $4)`,
      [userId, delta, reason, venueId ?? null]
    );
    return (res.rows[0]?.coins as number) ?? 0;
  });
}

/** Spend coins to unlock a venue. Throws if not enough. Idempotent per venue. */
export async function unlockVenue(
  userId: string,
  venueId: string,
  cost: number
): Promise<{ balance: number; alreadyUnlocked: boolean }> {
  return withTransaction(async (client) => {
    const existing = await client.query(
      `SELECT 1 FROM venue_unlocks WHERE user_id = $1 AND venue_id = $2`,
      [userId, venueId]
    );
    if ((existing.rowCount ?? 0) > 0) {
      const bal = await client.query(`SELECT coins FROM users WHERE id = $1`, [userId]);
      return { balance: bal.rows[0]?.coins ?? 0, alreadyUnlocked: true };
    }
    const balRow = await client.query(`SELECT coins FROM users WHERE id = $1 FOR UPDATE`, [userId]);
    const coins = balRow.rows[0]?.coins ?? 0;
    if (coins < cost) {
      const err = new Error('Not enough buddis');
      (err as any).status = 400;
      throw err;
    }
    await client.query(`UPDATE users SET coins = coins - $2 WHERE id = $1`, [userId, cost]);
    await client.query(
      `INSERT INTO coin_ledger (user_id, delta, reason, venue_id) VALUES ($1, $2, 'unlock', $3)`,
      [userId, -cost, venueId]
    );
    await client.query(
      `INSERT INTO venue_unlocks (user_id, venue_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, venueId]
    );
    return { balance: coins - cost, alreadyUnlocked: false };
  });
}
