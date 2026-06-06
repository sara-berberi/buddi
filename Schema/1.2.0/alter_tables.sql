-- Buddi — Schema v1.2.0 (additive, safe to re-run)
-- Adds: styleable person avatar (jsonb config) + public/private accounts.

-- Avatar config: { skin, hair, hairColor, accessory, bg }. Defaults to a
-- neutral person. avatar_emoji from 1.1.0 is kept as a fallback.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_config JSONB NOT NULL
    DEFAULT '{"skin":"#E8B894","hair":"short","hairColor":"#3A2A1A","accessory":"none","bg":"#C9E4D3"}'::jsonb;

-- Public/private account. Private = a follow stays a request until approved
-- (the existing pending/accepted flow already handles approval).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_city_private ON users (city, is_private);
