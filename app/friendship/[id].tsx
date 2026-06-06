import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFriendship, useMarkContact, useMissYou } from '../../hooks/useFriendships';
import { useFriendshipQuests } from '../../hooks/useQuests';
import { PlantSVG } from '../../components/plants/PlantSVG';
import { QuestCard } from '../../components/quest/QuestCard';
import { Button } from '../../components/ui/Button';
import { PersonAvatar } from '../../components/avatar/PersonAvatar';
import { colors, fonts, radius, spacing, HEALTH_LABEL } from '../../lib/constants';
import { relativeDays, formatTimestamp } from '../../lib/utils';

const KIND_LABEL: Record<string, string> = {
  hangout: 'Hung out',
  quest: 'Completed a quest',
  miss_you: 'Sent a “miss you”',
};

export default function FriendshipDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: f, isLoading } = useFriendship(id!);
  const { data: questData } = useFriendshipQuests(id!);
  const markContact = useMarkContact(id!);
  const missYou = useMissYou(id!);
  const [missSent, setMissSent] = useState(false);

  if (isLoading || !f) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  async function sendMissYou() {
    await missYou.mutateAsync();
    setMissSent(true);
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <PlantSVG health={f.health} stemColor={f.stemColor} size={160} />
        <View style={styles.heroNameRow}>
          <PersonAvatar config={f.friend.avatar} size={36} ring />
          <Text style={styles.name}>{f.friend.displayName}</Text>
        </View>
        <Text style={styles.handle}>@{f.friend.username}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: f.stemColor }]}>{HEALTH_LABEL[f.health]}</Text>
            <Text style={styles.statLabel}>Health</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{relativeDays(f.daysSinceContact)}</Text>
            <Text style={styles.statLabel}>Last contact</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label="We just hung out"
          variant="primary"
          loading={markContact.isPending}
          onPress={() => markContact.mutate(undefined)}
        />
        <Button
          label={missSent ? 'Miss you — sent 💭' : 'Miss you'}
          variant="ghost"
          disabled={missSent || missYou.isPending}
          onPress={sendMissYou}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      {/* Quest suggestions */}
      <Text style={styles.sectionLabel}>Do something together</Text>
      {!questData || questData.quests.length === 0 ? (
        <Text style={styles.empty}>No quest ideas right now.</Text>
      ) : (
        questData.quests.map((q) => (
          <QuestCard key={q.venue.id} quest={q} onPress={() => router.push(`/quest/${q.venue.id}`)} />
        ))
      )}

      {/* History */}
      <Text style={styles.sectionLabel}>History</Text>
      {!f.history || f.history.length === 0 ? (
        <Text style={styles.empty}>No history logged yet.</Text>
      ) : (
        f.history.map((h) => (
          <View key={h.id} style={styles.historyRow}>
            <Text style={styles.historyKind}>{KIND_LABEL[h.kind] ?? h.kind}</Text>
            <Text style={styles.historyTime}>{formatTimestamp(h.occurred_at)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  name: { fontFamily: fonts.headerItalic, fontSize: 30, color: colors.ink },
  handle: { fontFamily: fonts.mono, fontSize: 13, color: colors.muted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  statBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minWidth: 130,
  },
  statValue: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  statLabel: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 2 },
  actions: { marginBottom: spacing.lg },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted, marginTop: spacing.md, marginBottom: spacing.md },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginBottom: spacing.md },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyKind: { fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  historyTime: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
});
