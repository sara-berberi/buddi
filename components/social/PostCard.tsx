import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { Icon, type IconName } from '../ui/Icon';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import { formatTimestamp } from '../../lib/utils';
import type { Post } from '../../types';

interface Props {
  post: Post;
  currentUserId?: string;
  onLike: () => void;
  onRepost: () => void;
  onShareDM: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Render a post body with @mentions highlighted.
function PostBody({ body }: { body: string | null }) {
  if (!body) return null;
  const parts = body.split(/(@\w+)/g);
  return (
    <Text style={styles.body}>
      {parts.map((p, i) =>
        /^@\w+$/.test(p) ? (
          <Text key={i} style={styles.mention}>
            {p}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        )
      )}
    </Text>
  );
}

export function PostCard({ post, currentUserId, onLike, onRepost, onShareDM, onEdit, onDelete }: Props) {
  // A repost renders the original inside a quoted frame.
  const isRepost = Boolean(post.repostOf);
  const shown = post.repostOf ?? post;
  const [menuOpen, setMenuOpen] = useState(false);
  // Only the author of a non-repost can edit/delete.
  const mine = !isRepost && currentUserId && post.author.id === currentUserId;

  return (
    <View style={styles.card}>
      {isRepost && (
        <View style={styles.repostTagRow}>
          <Icon name="repost" size={13} color={colors.muted} />
          <Text style={styles.repostTag}>{post.author.displayName} reposted</Text>
        </View>
      )}

      <View style={styles.header}>
        <Avatar avatar={shown.author.avatar} size={40} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{shown.author.displayName}</Text>
          <Text style={styles.meta}>
            @{shown.author.username} · {formatTimestamp(shown.createdAt)}
            {post.editedAt ? ' · edited' : ''}
          </Text>
        </View>
        {mine && (
          <Pressable onPress={() => setMenuOpen((o) => !o)} hitSlop={8} style={styles.menuBtn}>
            <Text style={styles.menuDots}>···</Text>
          </Pressable>
        )}
      </View>

      {mine && menuOpen && (
        <View style={styles.menu}>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              onEdit?.();
            }}
          >
            <Icon name="edit" size={15} color={colors.ink} />
            <Text style={styles.menuText}>Edit</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              onDelete?.();
            }}
          >
            <Icon name="close" size={15} color="#C44A3A" />
            <Text style={[styles.menuText, { color: '#C44A3A' }]}>Delete</Text>
          </Pressable>
        </View>
      )}

      <PostBody body={shown.body} />

      <View style={styles.actions}>
        <Action
          icon={post.likedByMe ? 'heartFilled' : 'heart'}
          label={post.likeCount > 0 ? String(post.likeCount) : 'Like'}
          active={post.likedByMe}
          onPress={onLike}
        />
        <Action
          icon="repost"
          label={post.repostCount > 0 ? String(post.repostCount) : 'Repost'}
          onPress={onRepost}
        />
        {/* Link sharing temporarily disabled per request.
        <Action icon="link" label="Link" onPress={onShareLink} /> */}
        <Action icon="send" label="Send" onPress={onShareDM} />
      </View>
    </View>
  );
}

function Action({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const tint = active ? colors.bubbleDark : colors.muted;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]} hitSlop={6}>
      <Icon name={icon} size={18} color={tint} />
      <Text style={[styles.actionLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  repostTagRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  repostTag: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerText: { flex: 1, marginLeft: spacing.sm },
  name: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 1 },
  body: { fontFamily: fonts.body, fontSize: 17, lineHeight: 24, color: colors.ink, marginTop: spacing.sm },
  mention: { color: colors.bubbleDark, fontFamily: fonts.bodyMedium },
  menuBtn: { paddingHorizontal: spacing.sm },
  menuDots: { fontSize: 20, color: colors.muted, fontFamily: fonts.bodyMedium },
  menu: {
    alignSelf: 'flex-end',
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  menuText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 6 },
  actionLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
});
