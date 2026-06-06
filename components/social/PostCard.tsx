import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import { formatTimestamp } from '../../lib/utils';
import type { Post } from '../../types';

interface Props {
  post: Post;
  onLike: () => void;
  onRepost: () => void;
  onShareLink: () => void;
  onShareDM: () => void;
}

export function PostCard({ post, onLike, onRepost, onShareLink, onShareDM }: Props) {
  // A repost renders the original inside a quoted frame.
  const isRepost = Boolean(post.repostOf);
  const shown = post.repostOf ?? post;

  return (
    <View style={styles.card}>
      {isRepost && (
        <Text style={styles.repostTag}>🔁 {post.author.displayName} reposted</Text>
      )}

      <View style={styles.header}>
        <Avatar avatar={shown.author.avatar} size={40} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{shown.author.displayName}</Text>
          <Text style={styles.meta}>@{shown.author.username} · {formatTimestamp(shown.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.body}>{shown.body}</Text>

      <View style={styles.actions}>
        <Action
          glyph={post.likedByMe ? '❤️' : '🤍'}
          label={post.likeCount > 0 ? String(post.likeCount) : 'Like'}
          active={post.likedByMe}
          onPress={onLike}
        />
        <Action
          glyph="🔁"
          label={post.repostCount > 0 ? String(post.repostCount) : 'Repost'}
          onPress={onRepost}
        />
        <Action glyph="🔗" label="Link" onPress={onShareLink} />
        <Action glyph="✈️" label="Send" onPress={onShareDM} />
      </View>
    </View>
  );
}

function Action({
  glyph,
  label,
  active,
  onPress,
}: {
  glyph: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]} hitSlop={6}>
      <Text style={styles.actionGlyph}>{glyph}</Text>
      <Text style={[styles.actionLabel, active && { color: colors.bubbleDark }]}>{label}</Text>
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
  repostTag: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerText: { flex: 1, marginLeft: spacing.sm },
  name: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 1 },
  body: { fontFamily: fonts.body, fontSize: 17, lineHeight: 24, color: colors.ink, marginTop: spacing.sm },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 6 },
  actionGlyph: { fontSize: 16 },
  actionLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
});
