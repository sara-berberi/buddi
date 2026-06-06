import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThreads } from '../../hooks/useDM';
import { Avatar } from '../../components/ui/Avatar';
import { BlobMascot } from '../../components/brand/BlobMascot';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import { formatTimestamp } from '../../lib/utils';

export default function DmInbox() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading } = useThreads();

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.forest} style={{ marginTop: spacing.xl }} />
      ) : !data?.length ? (
        <View style={styles.empty}>
          <BlobMascot size={120} color={colors.sky} mood="wink" />
          <Text style={styles.emptyText}>No chats yet. Share a post or tap “Let’s go” on a quest to start one.</Text>
        </View>
      ) : (
        data.map((t) => (
          <Pressable
            key={t.id}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(`/dm/${t.id}`)}
          >
            <Avatar avatar={t.friend.avatar} size={50} />
            <View style={styles.info}>
              <Text style={styles.name}>{t.friend.displayName}</Text>
              <Text style={styles.preview} numberOfLines={1}>{t.preview}</Text>
            </View>
            {t.lastMessageAt && <Text style={styles.time}>{formatTimestamp(t.lastMessageAt)}</Text>}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  empty: { alignItems: 'center', marginTop: spacing.xxl },
  emptyText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  info: { flex: 1, marginLeft: spacing.sm },
  name: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  preview: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 1 },
  time: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
});
