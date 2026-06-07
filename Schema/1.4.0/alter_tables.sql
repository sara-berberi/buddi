-- Buddi — Schema v1.4.0 (additive, safe to re-run)
-- Companion type: each user chooses how their garden is visualized — a growing
-- plant or a googly-eyed creature buddy. Health logic is identical either way.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS companion_type TEXT NOT NULL DEFAULT 'plant'
    CHECK (companion_type IN ('plant', 'creature'));
