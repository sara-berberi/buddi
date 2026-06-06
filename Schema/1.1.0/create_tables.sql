-- Buddi — Schema v1.1.0
-- All statements are safe to re-run (IF NOT EXISTS).
-- Run manually in Railway's SQL console or via the backend migrate script.

-- Extensions ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- Users --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        TEXT NOT NULL UNIQUE,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    bio             TEXT,
    city            TEXT NOT NULL DEFAULT 'Tirana',
    avatar_emoji    TEXT NOT NULL DEFAULT '🌱',
    onboarded       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (lower(username));
CREATE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));

-- Onboarding answers (personality profile for future quest personalization)
CREATE TABLE IF NOT EXISTS onboarding_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_key    TEXT NOT NULL,
    answer          TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, question_key)
);

-- Refresh tokens (rotated on each use) -------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);

-- Friendships --------------------------------------------------------------
-- A friendship is mutual. We store a single row per pair, ordered so that
-- user_a_id < user_b_id to keep the pair unique regardless of who invited.
-- last_contact_at drives days_since_contact -> plant health (computed on API).
CREATE TABLE IF NOT EXISTS friendships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'accepted')),
    last_contact_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (user_a_id <> user_b_id),
    CHECK (user_a_id < user_b_id),
    UNIQUE (user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_a ON friendships (user_a_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_b ON friendships (user_b_id);

-- Contact log (history list shown in Friend Detail) ------------------------
CREATE TABLE IF NOT EXISTS contact_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    friendship_id   UUID NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
    logged_by       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind            TEXT NOT NULL DEFAULT 'hangout'
                        CHECK (kind IN ('hangout', 'quest', 'miss_you')),
    note            TEXT,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_events_friendship
    ON contact_events (friendship_id, occurred_at DESC);

-- "Miss You" signals -------------------------------------------------------
CREATE TABLE IF NOT EXISTS miss_you_signals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    friendship_id   UUID NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seen            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_miss_you_recipient
    ON miss_you_signals (recipient_id, seen);

-- Daily Questions ----------------------------------------------------------
-- One question is "active" per calendar day. active_date assigns it.
CREATE TABLE IF NOT EXISTS daily_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt          TEXT NOT NULL UNIQUE,
    active_date     DATE UNIQUE,            -- the day this question is live (nullable until scheduled)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_questions_active_date
    ON daily_questions (active_date);

-- Daily Answers (uneditable after posting; enforced by no UPDATE endpoint) --
CREATE TABLE IF NOT EXISTS daily_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id     UUID NOT NULL REFERENCES daily_questions(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (question_id, user_id)           -- one answer per user per question
);

CREATE INDEX IF NOT EXISTS idx_daily_answers_question
    ON daily_answers (question_id, created_at DESC);

-- Venues (B2B registered, paid placement) ----------------------------------
CREATE TABLE IF NOT EXISTS venues (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    city            TEXT NOT NULL DEFAULT 'Tirana',
    neighborhood    TEXT NOT NULL,
    category        TEXT NOT NULL
                        CHECK (category IN ('cafe', 'food', 'outdoor', 'culture')),
    price_range     TEXT NOT NULL DEFAULT '$$'
                        CHECK (price_range IN ('$', '$$', '$$$')),
    description     TEXT,
    photo_url       TEXT,
    featured        BOOLEAN NOT NULL DEFAULT FALSE,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (name, neighborhood)
);

CREATE INDEX IF NOT EXISTS idx_venues_city_active
    ON venues (city, active);

-- Discussion topics pool (Buddi-controlled, matched to venue category) -----
CREATE TABLE IF NOT EXISTS discussion_topics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category        TEXT NOT NULL
                        CHECK (category IN ('cafe', 'food', 'outdoor', 'culture', 'any')),
    topic           TEXT NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discussion_topics_category
    ON discussion_topics (category);

-- Quest suggestions (generated, optionally tied to a friendship) -----------
-- Persisted so "Show another" and friendship-specific lists are reproducible.
CREATE TABLE IF NOT EXISTS quests (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id          UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    friendship_id     UUID REFERENCES friendships(id) ON DELETE CASCADE, -- null = city-wide / Tonight
    for_user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    suggested_time    TEXT NOT NULL DEFAULT 'Tonight, 7:00 PM',
    status            TEXT NOT NULL DEFAULT 'suggested'
                          CHECK (status IN ('suggested', 'accepted', 'completed', 'dismissed')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quests_friendship ON quests (friendship_id);
CREATE INDEX IF NOT EXISTS idx_quests_for_user ON quests (for_user_id);

-- Which discussion topics are attached to a given quest --------------------
CREATE TABLE IF NOT EXISTS quest_topics (
    quest_id        UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    topic_id        UUID NOT NULL REFERENCES discussion_topics(id) ON DELETE CASCADE,
    PRIMARY KEY (quest_id, topic_id)
);
