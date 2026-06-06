import { Router } from 'express';
import { query, queryOne, execute } from '../db/client.js';
import { asyncHandler, badRequest, notFound, conflict } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { friendIds, areFriends } from '../lib/friends.js';
import { DEFAULT_AVATAR } from '../lib/userShape.js';

export const postsRouter = Router();
postsRouter.use(requireAuth);

// A flattened post row (author + optional original-author for reposts) plus
// like/repost counts and whether the current user liked it.
const POST_SELECT = `
  SELECT p.id, p.body, p.created_at, p.repost_of,
         a.id AS author_id, a.username AS author_username,
         a.display_name AS author_name, a.avatar_config AS author_avatar,
         o.id AS orig_id, o.body AS orig_body, o.created_at AS orig_created_at,
         oa.id AS orig_author_id, oa.username AS orig_author_username,
         oa.display_name AS orig_author_name, oa.avatar_config AS orig_author_avatar,
         (SELECT count(*) FROM post_likes pl WHERE pl.post_id = p.id)::int AS like_count,
         (SELECT count(*) FROM posts rp WHERE rp.repost_of = p.id)::int AS repost_count,
         EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1) AS liked_by_me
  FROM posts p
  JOIN users a ON a.id = p.author_id
  LEFT JOIN posts o ON o.id = p.repost_of
  LEFT JOIN users oa ON oa.id = o.author_id
`;

interface PostRow {
  id: string;
  body: string | null;
  created_at: string;
  repost_of: string | null;
  author_id: string;
  author_username: string;
  author_name: string;
  author_avatar: unknown;
  orig_id: string | null;
  orig_body: string | null;
  orig_created_at: string | null;
  orig_author_id: string | null;
  orig_author_username: string | null;
  orig_author_name: string | null;
  orig_author_avatar: unknown;
  like_count: number;
  repost_count: number;
  liked_by_me: boolean;
}

function shapePost(r: PostRow) {
  const base = {
    id: r.id,
    body: r.body,
    createdAt: r.created_at,
    likeCount: r.like_count,
    repostCount: r.repost_count,
    likedByMe: r.liked_by_me,
    author: {
      id: r.author_id,
      username: r.author_username,
      displayName: r.author_name,
      avatar: r.author_avatar ?? DEFAULT_AVATAR,
    },
    repostOf: null as null | object,
  };
  if (r.repost_of && r.orig_id) {
    base.repostOf = {
      id: r.orig_id,
      body: r.orig_body,
      createdAt: r.orig_created_at,
      author: {
        id: r.orig_author_id,
        username: r.orig_author_username,
        displayName: r.orig_author_name,
        avatar: r.orig_author_avatar ?? DEFAULT_AVATAR,
      },
    };
  }
  return base;
}

// GET /posts/feed — your posts + accepted friends' posts, newest first -------
postsRouter.get(
  '/feed',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const ids = await friendIds(me);
    const authorIds = [me, ...ids];
    const rows = await query<PostRow>(
      `${POST_SELECT}
       WHERE p.author_id = ANY($2)
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [me, authorIds]
    );
    res.json({ posts: rows.map(shapePost) });
  })
);

// GET /posts/user/:id — a single user's posts (profile/friend detail) --------
postsRouter.get(
  '/user/:id',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const target = req.params.id;
    if (target !== me && !(await areFriends(me, target))) {
      throw notFound('Not available');
    }
    const rows = await query<PostRow>(
      `${POST_SELECT} WHERE p.author_id = $2 ORDER BY p.created_at DESC LIMIT 50`,
      [me, target]
    );
    res.json({ posts: rows.map(shapePost) });
  })
);

// GET /posts/:id — single post (used by share-by-link) ----------------------
postsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const row = await queryOne<PostRow>(`${POST_SELECT} WHERE p.id = $2`, [me, req.params.id]);
    if (!row) throw notFound('Post not found');
    // Visible if mine or the author is my friend.
    if (row.author_id !== me && !(await areFriends(me, row.author_id))) {
      throw notFound('Post not found');
    }
    res.json({ post: shapePost(row) });
  })
);

// POST /posts  { body } — create a status -----------------------------------
postsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const body = String(req.body?.body ?? '').trim();
    if (!body) throw badRequest('body is required');
    if (body.length > 500) throw badRequest('Status must be 500 characters or fewer');
    const created = await queryOne<{ id: string }>(
      `INSERT INTO posts (author_id, body) VALUES ($1, $2) RETURNING id`,
      [me, body]
    );
    const row = await queryOne<PostRow>(`${POST_SELECT} WHERE p.id = $2`, [me, created!.id]);
    res.status(201).json({ post: shapePost(row!) });
  })
);

// POST /posts/:id/like  /  DELETE /posts/:id/like ---------------------------
postsRouter.post(
  '/:id/like',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    await execute(
      `INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.params.id, me]
    );
    res.json({ ok: true, liked: true });
  })
);

postsRouter.delete(
  '/:id/like',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    await execute(`DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`, [
      req.params.id,
      me,
    ]);
    res.json({ ok: true, liked: false });
  })
);

// POST /posts/:id/repost — reshare a friend's post --------------------------
postsRouter.post(
  '/:id/repost',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const orig = await queryOne<{ id: string; author_id: string; repost_of: string | null }>(
      `SELECT id, author_id, repost_of FROM posts WHERE id = $1`,
      [req.params.id]
    );
    if (!orig) throw notFound('Post not found');
    // Repost the underlying original, not a repost-of-a-repost.
    const targetId = orig.repost_of ?? orig.id;
    const targetAuthor = await queryOne<{ author_id: string }>(
      `SELECT author_id FROM posts WHERE id = $1`,
      [targetId]
    );
    if (
      targetAuthor &&
      targetAuthor.author_id !== me &&
      !(await areFriends(me, targetAuthor.author_id))
    ) {
      throw notFound('Post not found');
    }
    const dup = await queryOne<{ id: string }>(
      `SELECT id FROM posts WHERE author_id = $1 AND repost_of = $2`,
      [me, targetId]
    );
    if (dup) throw conflict('Already reposted');

    const created = await queryOne<{ id: string }>(
      `INSERT INTO posts (author_id, body, repost_of) VALUES ($1, '(repost)', $2) RETURNING id`,
      [me, targetId]
    );
    const row = await queryOne<PostRow>(`${POST_SELECT} WHERE p.id = $2`, [me, created!.id]);
    res.status(201).json({ post: shapePost(row!) });
  })
);
