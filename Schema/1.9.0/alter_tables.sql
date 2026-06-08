-- Buddi — Schema v1.9.0 (additive, safe to re-run)
-- "Buddis" coin economy: earn by doing quests, spend to unlock pricier ones.

ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 50;

-- Per-quest/venue unlock cost (0 = free). Cheap cafes free; featured cost more.
ALTER TABLE venues ADD COLUMN IF NOT EXISTS unlock_cost INTEGER NOT NULL DEFAULT 0;

-- Ledger of coin changes (audit + lets us prevent double-awarding).
CREATE TABLE IF NOT EXISTS coin_ledger (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delta       INTEGER NOT NULL,           -- +earned / -spent
    reason      TEXT NOT NULL,              -- 'quest_done' | 'unlock' | 'signup'
    venue_id    UUID REFERENCES venues(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coin_ledger_user ON coin_ledger (user_id, created_at DESC);

-- Which venues a user has unlocked (spent coins on). Free venues never need this.
CREATE TABLE IF NOT EXISTS venue_unlocks (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id    UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, venue_id)
);

-- Give the featured venues a cost so the economy has something to spend on.
UPDATE venues SET unlock_cost = 30 WHERE featured = TRUE AND unlock_cost = 0;
