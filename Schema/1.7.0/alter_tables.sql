-- Buddi — Schema v1.7.0 (additive, safe to re-run)
-- Let users hide their location (city) from others.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS hide_location BOOLEAN NOT NULL DEFAULT FALSE;
