-- Buddi — Schema v1.6.0 (additive, safe to re-run)
-- Editable statuses: track edits.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
