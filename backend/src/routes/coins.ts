import { Router } from 'express';
import { query, queryOne } from '../db/client.js';
import { asyncHandler, badRequest, notFound, ApiError } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { unlockVenue } from '../lib/coins.js';

export const coinsRouter = Router();
coinsRouter.use(requireAuth);

// GET /coins — balance + recent ledger -------------------------------------
coinsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const user = await queryOne<{ coins: number }>(`SELECT coins FROM users WHERE id = $1`, [me]);
    const ledger = await query(
      `SELECT cl.delta, cl.reason, cl.created_at, v.name AS venue_name
       FROM coin_ledger cl LEFT JOIN venues v ON v.id = cl.venue_id
       WHERE cl.user_id = $1 ORDER BY cl.created_at DESC LIMIT 30`,
      [me]
    );
    res.json({
      balance: user?.coins ?? 0,
      ledger: ledger.map((r: any) => ({
        delta: r.delta,
        reason: r.reason,
        venueName: r.venue_name,
        createdAt: r.created_at,
      })),
    });
  })
);

// POST /coins/unlock  { venueId } — spend buddis to unlock a venue ----------
coinsRouter.post(
  '/unlock',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const venueId = String(req.body?.venueId ?? '');
    if (!venueId) throw badRequest('venueId is required');
    const venue = await queryOne<{ unlock_cost: number }>(
      `SELECT unlock_cost FROM venues WHERE id = $1 AND active = TRUE`,
      [venueId]
    );
    if (!venue) throw notFound('Venue not found');
    try {
      const { balance, alreadyUnlocked } = await unlockVenue(me, venueId, venue.unlock_cost);
      res.json({ balance, unlocked: true, alreadyUnlocked });
    } catch (e) {
      if (e instanceof Error && (e as any).status === 400) throw new ApiError(400, e.message);
      throw e;
    }
  })
);
