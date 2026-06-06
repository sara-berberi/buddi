import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTonightQuests } from '../../hooks/useQuests';
import { QuestCard } from '../quest/QuestCard';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import { TAB_BAR_SPACE } from '../nav/tabBarMetrics';
import type { VenueCategory } from '../../types';

const FILTERS: { key: VenueCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'cafe', label: 'Café' },
  { key: 'food', label: 'Food' },
  { key: 'outdoor', label: 'Outdoor' },
  { key: 'culture', label: 'Culture' },
];

export default function TonightScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<VenueCategory | 'all'>('all');
  const { data, isLoading } = useTonightQuests(filter === 'all' ? undefined : filter);

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: TAB_BAR_SPACE + insets.bottom },
      ]}
    >
      <Text style={styles.kicker}>Tonight in</Text>
      <Text style={styles.city}>{data?.city ?? 'Tirana'}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.forest} style={{ marginTop: spacing.xl }} />
      ) : !data || data.quests.length === 0 ? (
        <Text style={styles.empty}>No quests here yet. Check back soon.</Text>
      ) : (
        data.quests.map((q) => (
          <QuestCard key={q.venue.id} quest={q} onPress={() => router.push(`/quest/${q.venue.id}`)} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  kicker: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber, textTransform: 'uppercase', letterSpacing: 1 },
  city: { fontFamily: fonts.headerItalic, fontSize: 32, color: colors.ink, marginBottom: spacing.md },
  pills: { gap: spacing.sm, paddingVertical: spacing.sm, paddingRight: spacing.lg },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  pillText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  pillTextActive: { color: colors.cream },
  empty: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: spacing.xxl },
});
