-- Buddi — Schema v1.3.0 (additive, safe to re-run)
-- Social layer: statuses (posts), likes, reposts, and direct messages.

-- Posts (text statuses) ----------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
    -- A repost points at the original post; reposts carry no body of their own.
    repost_of       UUID REFERENCES posts(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_repost_of ON posts (repost_of);

-- Likes --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_likes (
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

-- DM threads (one per friend pair, ordered a<b like friendships) -----------
CREATE TABLE IF NOT EXISTS dm_threads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ,
    CHECK (user_a_id < user_b_id),
    UNIQUE (user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_threads_a ON dm_threads (user_a_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_threads_b ON dm_threads (user_b_id, last_message_at DESC);

-- DM messages. A message is text and/or a "share card" referencing a post
-- or a venue (the Let's-go / share-in-DM flows).
CREATE TABLE IF NOT EXISTS dm_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       UUID NOT NULL REFERENCES dm_threads(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT,
    -- Optional share card:
    share_kind      TEXT CHECK (share_kind IN ('post', 'venue')),
    share_post_id   UUID REFERENCES posts(id) ON DELETE SET NULL,
    share_venue_id  UUID REFERENCES venues(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Must carry something: text or a share card.
    CHECK (
      (body IS NOT NULL AND char_length(body) BETWEEN 1 AND 1000)
      OR share_kind IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_thread ON dm_messages (thread_id, created_at ASC);
