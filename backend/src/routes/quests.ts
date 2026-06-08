import { Router } from 'express';
import { query, queryOne, execute } from '../db/client.js';
import { asyncHandler, notFound, badRequest } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { ensureThread, areFriends } from '../lib/friends.js';
import { adjustCoins, QUEST_REWARD } from '../lib/coins.js';

export const questsRouter = Router();
questsRouter.use(requireAuth);

interface VenueRow {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  category: string;
  price_range: string;
  description: string | null;
  photo_url: string | null;
  featured: boolean;
  unlock_cost: number;
}

function shapeVenue(v: VenueRow, unlocked: Set<string>) {
  const locked = v.unlock_cost > 0 && !unlocked.has(v.id);
  return {
    id: v.id,
    name: v.name,
    city: v.city,
    neighborhood: v.neighborhood,
    category: v.category,
    priceRange: v.price_range,
    description: v.description,
    photoUrl: v.photo_url,
    featured: v.featured,
    unlockCost: v.unlock_cost,
    locked,
  };
}

/** Set of venue ids this user has unlocked. */
async function unlockedSet(userId: string): Promise<Set<string>> {
  const rows = await query<{ venue_id: string }>(
    `SELECT venue_id FROM venue_unlocks WHERE user_id = $1`,
    [userId]
  );
  return new Set(rows.map((r) => r.venue_id));
}

const TIME_BY_CATEGORY: Record<string, string> = {
  cafe: 'Tomorrow, 10:30 AM',
  food: 'Tonight, 7:30 PM',
  outdoor: 'Saturday, 4:00 PM',
  culture: 'Sunday, 2:00 PM',
};

// Pick 2 discussion topics for a venue category (category-specific + 'any').
async function topicsForCategory(category: string): Promise<string[]> {
  const rows = await query<{ topic: string }>(
    `SELECT topic FROM discussion_topics
     WHERE category = $1 OR category = 'any'
     ORDER BY random()
     LIMIT 2`,
    [category]
  );
  return rows.map((r) => r.topic);
}

async function buildQuestCard(v: VenueRow, unlocked: Set<string>) {
  return {
    venue: shapeVenue(v, unlocked),
    suggestedTime: TIME_BY_CATEGORY[v.category] ?? 'Tonight, 7:00 PM',
    topics: await topicsForCategory(v.category),
  };
}

// GET /quests?city=&category= ---------------------------------------------
// Tonight tab discovery. Deterministic weighted selection: featured first,
// then variety by category, then recency-shuffled.
questsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const user = await queryOne<{ city: string }>(`SELECT city FROM users WHERE id = $1`, [me]);
    const city = String(req.query.city ?? user?.city ?? 'Tirana');
    const category = req.query.category ? String(req.query.category) : null;

    const venues = await query<VenueRow>(
      `SELECT * FROM venues
       WHERE active = TRUE AND lower(city) = lower($1)
         AND ($2::text IS NULL OR category = $2)
       ORDER BY featured DESC, random()
       LIMIT 24`,
      [city, category]
    );

    const unlocked = await unlockedSet(me);
    const cards = await Promise.all(venues.map((v) => buildQuestCard(v, unlocked)));
    res.json({ city, quests: cards });
  })
);

// GET /quests/friendship/:id ----------------------------------------------
// 2–3 venue suggestions specific to a friendship (OPEN-003: max 3).
questsRouter.get(
  '/friendship/:id',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const fr = await queryOne<{ id: string }>(
      `SELECT id FROM friendships
       WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2) AND status = 'accepted'`,
      [req.params.id, me]
    );
    if (!fr) throw notFound('Friendship not found');

    const user = await queryOne<{ city: string }>(`SELECT city FROM users WHERE id = $1`, [me]);
    const city = user?.city ?? 'Tirana';

    // Variety: one per distinct category where possible, then fill to 3.
    const venues = await query<VenueRow>(
      `WITH ranked AS (
         SELECT *, row_number() OVER (PARTITION BY category ORDER BY featured DESC, random()) AS rn
         FROM venues
         WHERE active = TRUE AND lower(city) = lower($1)
       )
       SELECT * FROM ranked
       ORDER BY rn ASC, featured DESC, random()
       LIMIT 3`,
      [city]
    );

    const unlocked = await unlockedSet(me);
    const cards = await Promise.all(venues.map((v) => buildQuestCard(v, unlocked)));
    res.json({ friendshipId: req.params.id, quests: cards });
  })
);

// GET /quests/venue/:id ----------------------------------------------------
// Full quest detail for a single venue.
questsRouter.get(
  '/venue/:id',
  asyncHandler(async (req, res) => {
    const venue = await queryOne<VenueRow>(
      `SELECT * FROM venues WHERE id = $1 AND active = TRUE`,
      [req.params.id]
    );
    if (!venue) throw notFound('Venue not found');
    const unlocked = await unlockedSet(req.userId!);
    res.json({ quest: await buildQuestCard(venue, unlocked) });
  })
);

// POST /quests/lets-go  { venueId, friendId } -------------------------------
// "Let's go": records the quest as accepted, logs a contact event against the
// friendship (nudges the plant), and ensures a DM thread so the two can plan.
// Returns the DM thread id; the client then shares the venue card into it.
questsRouter.post(
  '/lets-go',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const { venueId, friendId } = req.body ?? {};
    if (!venueId || !friendId) throw badRequest('venueId and friendId are required');
    if (!(await areFriends(me, friendId))) throw badRequest('You can only plan with a friend');

    const venue = await queryOne<{ id: string }>(
      `SELECT id FROM venues WHERE id = $1 AND active = TRUE`,
      [venueId]
    );
    if (!venue) throw notFound('Venue not found');

    // Find the friendship to log contact against.
    const [lo, hi] = me < friendId ? [me, friendId] : [friendId, me];
    const fr = await queryOne<{ id: string }>(
      `SELECT id FROM friendships WHERE user_a_id = $1 AND user_b_id = $2 AND status = 'accepted'`,
      [lo, hi]
    );
    let coinsAwarded = 0;
    let balance: number | undefined;
    if (fr) {
      await execute(
        `INSERT INTO quests (venue_id, friendship_id, for_user_id, status)
         VALUES ($1, $2, $3, 'accepted')`,
        [venueId, fr.id, me]
      );
      await execute(
        `INSERT INTO contact_events (friendship_id, logged_by, kind, note)
         VALUES ($1, $2, 'quest', 'Planning a quest')`,
        [fr.id, me]
      );
      // Award buddis — but only once per (user, venue) so it can't be farmed.
      const earned = await queryOne<{ id: string }>(
        `SELECT id FROM coin_ledger WHERE user_id = $1 AND venue_id = $2 AND reason = 'quest_done' LIMIT 1`,
        [me, venueId]
      );
      if (!earned) {
        balance = await adjustCoins(me, QUEST_REWARD, 'quest_done', venueId);
        coinsAwarded = QUEST_REWARD;
      }
    }

    const threadId = await ensureThread(me, friendId);
    res.json({ threadId, venueId, coinsAwarded, balance });
  })
);
