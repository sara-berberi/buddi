import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useDailyHistory } from '../../hooks/useDaily';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import { formatTimestamp } from '../../lib/utils';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: api.getProfile });
  const { data: history } = useDailyHistory();

  if (isLoading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  const { user, stats } = profile;

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <View style={styles.header}>
        <Avatar emoji={user.avatarEmoji} name={user.displayName} size={72} />
        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.handle}>@{user.username} · {user.city}</Text>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      </View>

      <View style={styles.stats}>
        <Stat value={stats.friends} label="Friends" />
        <Stat value={stats.answers} label="Answers" />
      </View>

      <Text style={styles.sectionLabel}>Your past answers</Text>
      {!history || history.length === 0 ? (
        <Text style={styles.empty}>You haven’t answered any daily questions yet.</Text>
      ) : (
        history.map((h) => (
          <View key={h.id} style={styles.historyCard}>
            <Text style={styles.historyPrompt}>{h.prompt}</Text>
            <Text style={styles.historyBody}>{h.body}</Text>
            <Text style={styles.historyTime}>{formatTimestamp(h.created_at)}</Text>
          </View>
        ))
      )}

      <Button label="Log out" variant="ghost" onPress={logout} style={{ marginTop: spacing.xl }} />
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  name: { fontFamily: fonts.headerItalic, fontSize: 28, color: colors.ink, marginTop: spacing.sm },
  handle: { fontFamily: fonts.mono, fontSize: 13, color: colors.muted, marginTop: 2 },
  bio: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlign: 'center', marginTop: spacing.sm },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.mono, fontSize: 26, color: colors.forest },
  statLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted, marginBottom: spacing.md },
  empty: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  historyPrompt: { fontFamily: fonts.headerItalic, fontSize: 16, color: colors.muted, marginBottom: spacing.xs },
  historyBody: { fontFamily: fonts.body, fontSize: 16, color: colors.ink, lineHeight: 22 },
  historyTime: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: spacing.sm },
});
