-- Buddi — Schema v1.8.0 (additive, safe to re-run)
-- Group chats: threads can be 1:1 (existing pair columns) or group (members table).

ALTER TABLE dm_threads ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE dm_threads ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE dm_threads ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Group threads don't use the a<b pair columns, so allow them to be null.
ALTER TABLE dm_threads ALTER COLUMN user_a_id DROP NOT NULL;
ALTER TABLE dm_threads ALTER COLUMN user_b_id DROP NOT NULL;

-- The a<b check must only apply to 1:1 threads. Drop the old unconditional one
-- (named by Postgres) is awkward; instead add a tolerant check that permits
-- nulls (groups) and keeps ordering for pairs. Old constraint may still exist
-- from 1.3.0; this ADD is guarded so re-runs don't error.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dm_threads_pair_order'
  ) THEN
    ALTER TABLE dm_threads
      ADD CONSTRAINT dm_threads_pair_order
      CHECK (user_a_id IS NULL OR user_b_id IS NULL OR user_a_id < user_b_id);
  END IF;
END $$;

-- Members of a thread (used for groups; 1:1 threads can also be backfilled but
-- aren't required to be — authz checks both pair columns and membership).
CREATE TABLE IF NOT EXISTS dm_members (
    thread_id   UUID NOT NULL REFERENCES dm_threads(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (thread_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_dm_members_user ON dm_members (user_id);
