import { Router } from 'express';
import { query, queryOne, execute } from '../db/client.js';
import { asyncHandler, badRequest, notFound, conflict } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { areFriends, ensureThread } from '../lib/friends.js';
import { DEFAULT_AVATAR } from '../lib/userShape.js';

export const dmRouter = Router();
dmRouter.use(requireAuth);

// A user belongs to a thread if they're one of the 1:1 pair OR a group member.
async function assertMember(threadId: string, me: string): Promise<{ isGroup: boolean }> {
  const t = await queryOne<{ user_a_id: string | null; user_b_id: string | null; is_group: boolean }>(
    `SELECT user_a_id, user_b_id, is_group FROM dm_threads WHERE id = $1`,
    [threadId]
  );
  if (!t) throw notFound('Thread not found');
  if (t.user_a_id === me || t.user_b_id === me) return { isGroup: t.is_group };
  const m = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM dm_members WHERE thread_id = $1 AND user_id = $2`,
    [threadId, me]
  );
  if (!m) throw notFound('Thread not found');
  return { isGroup: t.is_group };
}

// GET /dm/threads — inbox: 1:1 and group threads, newest first --------------
dmRouter.get(
  '/threads',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const rows = await query(
      `
      WITH my_threads AS (
        SELECT id FROM dm_threads WHERE user_a_id = $1 OR user_b_id = $1
        UNION
        SELECT thread_id AS id FROM dm_members WHERE user_id = $1
      )
      SELECT t.id, t.is_group, t.title, t.last_message_at,
             u.id AS other_id, u.username, u.display_name, u.avatar_config,
             (SELECT body FROM dm_messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_body,
             (SELECT share_kind FROM dm_messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_share,
             (SELECT count(*)::int FROM dm_members dm WHERE dm.thread_id = t.id) AS member_count
      FROM dm_threads t
      JOIN my_threads mt ON mt.id = t.id
      LEFT JOIN users u
        ON (NOT t.is_group)
       AND u.id = CASE WHEN t.user_a_id = $1 THEN t.user_b_id ELSE t.user_a_id END
      ORDER BY t.last_message_at DESC NULLS LAST
      `,
      [me]
    );
    res.json({
      threads: rows.map((r: any) => ({
        id: r.id,
        isGroup: r.is_group,
        title: r.is_group ? r.title ?? 'Group' : r.display_name,
        lastMessageAt: r.last_message_at,
        memberCount: r.member_count,
        preview: r.last_body ?? (r.last_share ? `Shared a ${r.last_share}` : 'Say hi 👋'),
        friend: r.is_group
          ? null
          : {
              id: r.other_id,
              username: r.username,
              displayName: r.display_name,
              avatar: r.avatar_config ?? DEFAULT_AVATAR,
            },
      })),
    });
  })
);

// POST /dm/with/:userId — get/create a 1:1 thread with a friend --------------
dmRouter.post(
  '/with/:userId',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const other = req.params.userId;
    if (other === me) throw badRequest('Cannot DM yourself');
    if (!(await areFriends(me, other))) throw conflict('You can only DM friends');
    const threadId = await ensureThread(me, other);
    res.json({ threadId });
  })
);

// POST /dm/group  { title, memberIds[] } — create a group chat ---------------
dmRouter.post(
  '/group',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const title = String(req.body?.title ?? '').trim();
    const memberIds: string[] = Array.isArray(req.body?.memberIds) ? req.body.memberIds : [];
    if (!title) throw badRequest('Group needs a name');
    if (memberIds.length < 2) throw badRequest('Pick at least 2 friends');

    // Everyone added must be a friend of the creator.
    for (const id of memberIds) {
      if (id === me) continue;
      if (!(await areFriends(me, id))) throw badRequest('You can only add friends');
    }

    const thread = await queryOne<{ id: string }>(
      `INSERT INTO dm_threads (is_group, title, created_by, last_message_at)
       VALUES (TRUE, $1, $2, now()) RETURNING id`,
      [title, me]
    );
    const everyone = Array.from(new Set([me, ...memberIds]));
    for (const uid of everyone) {
      await execute(
        `INSERT INTO dm_members (thread_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [thread!.id, uid]
      );
    }
    res.status(201).json({ threadId: thread!.id });
  })
);

// POST /dm/:threadId/members  { memberIds[] } — add people to a group --------
dmRouter.post(
  '/:threadId/members',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    const { isGroup } = await assertMember(req.params.threadId, me);
    if (!isGroup) throw badRequest('Not a group chat');
    const memberIds: string[] = Array.isArray(req.body?.memberIds) ? req.body.memberIds : [];
    for (const id of memberIds) {
      if (!(await areFriends(me, id))) throw badRequest('You can only add friends');
      await execute(
        `INSERT INTO dm_members (thread_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [req.params.threadId, id]
      );
    }
    res.json({ ok: true });
  })
);

// GET /dm/:threadId/info — title + members (for the group header) -----------
dmRouter.get(
  '/:threadId/info',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    await assertMember(req.params.threadId, me);
    const t = await queryOne<{ is_group: boolean; title: string | null }>(
      `SELECT is_group, title FROM dm_threads WHERE id = $1`,
      [req.params.threadId]
    );
    const members = await query(
      `SELECT u.id, u.username, u.display_name, u.avatar_config
       FROM dm_members dm JOIN users u ON u.id = dm.user_id
       WHERE dm.thread_id = $1 ORDER BY u.display_name`,
      [req.params.threadId]
    );
    res.json({
      isGroup: t?.is_group ?? false,
      title: t?.title ?? null,
      members: members.map((m: any) => ({
        id: m.id,
        username: m.username,
        displayName: m.display_name,
        avatar: m.avatar_config ?? DEFAULT_AVATAR,
      })),
    });
  })
);

const MESSAGE_SELECT = `
  SELECT m.id, m.thread_id, m.sender_id, m.body, m.created_at,
         m.share_kind, m.share_post_id, m.share_venue_id,
         s.display_name AS sender_name, s.avatar_config AS sender_avatar,
         p.body AS post_body,
         pa.display_name AS post_author_name,
         v.name AS venue_name, v.neighborhood AS venue_neighborhood, v.category AS venue_category
  FROM dm_messages m
  JOIN users s ON s.id = m.sender_id
  LEFT JOIN posts p ON p.id = m.share_post_id
  LEFT JOIN users pa ON pa.id = p.author_id
  LEFT JOIN venues v ON v.id = m.share_venue_id
`;

function shapeMessage(r: any) {
  let share = null;
  if (r.share_kind === 'post' && r.share_post_id) {
    share = { kind: 'post', postId: r.share_post_id, postBody: r.post_body, postAuthor: r.post_author_name };
  } else if (r.share_kind === 'venue' && r.share_venue_id) {
    share = {
      kind: 'venue',
      venueId: r.share_venue_id,
      venueName: r.venue_name,
      neighborhood: r.venue_neighborhood,
      category: r.venue_category,
    };
  }
  return {
    id: r.id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    senderAvatar: r.sender_avatar ?? DEFAULT_AVATAR,
    body: r.body,
    createdAt: r.created_at,
    share,
  };
}

// GET /dm/:threadId/messages?after=ISO --------------------------------------
dmRouter.get(
  '/:threadId/messages',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    await assertMember(req.params.threadId, me);
    const after = req.query.after ? String(req.query.after) : null;
    const rows = await query(
      `${MESSAGE_SELECT}
       WHERE m.thread_id = $1 AND ($2::timestamptz IS NULL OR m.created_at > $2)
       ORDER BY m.created_at ASC
       LIMIT 200`,
      [req.params.threadId, after]
    );
    res.json({ messages: rows.map(shapeMessage) });
  })
);

// POST /dm/:threadId/messages  { body?, share? } ----------------------------
dmRouter.post(
  '/:threadId/messages',
  asyncHandler(async (req, res) => {
    const me = req.userId!;
    await assertMember(req.params.threadId, me);
    const body = req.body?.body ? String(req.body.body).trim() : null;
    const share = req.body?.share ?? null;
    if (!body && !share) throw badRequest('Message needs text or a share');
    if (body && body.length > 1000) throw badRequest('Message too long');

    let shareKind: string | null = null;
    let postId: string | null = null;
    let venueId: string | null = null;
    if (share) {
      if (share.kind === 'post' && share.postId) {
        shareKind = 'post';
        postId = String(share.postId);
      } else if (share.kind === 'venue' && share.venueId) {
        shareKind = 'venue';
        venueId = String(share.venueId);
      } else {
        throw badRequest('Invalid share');
      }
    }

    const created = await queryOne<{ id: string }>(
      `INSERT INTO dm_messages (thread_id, sender_id, body, share_kind, share_post_id, share_venue_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.params.threadId, me, body, shareKind, postId, venueId]
    );
    await execute(`UPDATE dm_threads SET last_message_at = now() WHERE id = $1`, [req.params.threadId]);
    const row = await queryOne(`${MESSAGE_SELECT} WHERE m.id = $1`, [created!.id]);
    res.status(201).json({ message: shapeMessage(row) });
  })
);
