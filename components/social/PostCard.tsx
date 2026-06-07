import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { Icon, type IconName } from '../ui/Icon';
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
        <View style={styles.repostTagRow}>
          <Icon name="repost" size={13} color={colors.muted} />
          <Text style={styles.repostTag}>{post.author.displayName} reposted</Text>
        </View>
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
        <Action icon="link" label="Link" onPress={onShareLink} />
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
