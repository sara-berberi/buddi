import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVenueQuest } from '../../hooks/useQuests';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import { CATEGORY_LABEL } from '../../lib/utils';

export default function QuestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useVenueQuest(id!);

  if (isLoading || !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  const { venue, suggestedTime, topics } = data.quest;

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
    >
      <View style={styles.badges}>
        <Badge label={CATEGORY_LABEL[venue.category] ?? venue.category} />
        {venue.featured && <Badge label="Featured" color={colors.forest} />}
      </View>

      <Text style={styles.name}>{venue.name}</Text>
      <Text style={styles.meta}>
        {venue.neighborhood}, {venue.city} · {venue.priceRange}
      </Text>

      {venue.description ? <Text style={styles.description}>{venue.description}</Text> : null}

      <View style={styles.timeBox}>
        <Text style={styles.timeLabel}>Suggested time</Text>
        <Text style={styles.time}>{suggestedTime}</Text>
      </View>

      <Text style={styles.sectionLabel}>Talk about</Text>
      {topics.map((t, i) => (
        <View key={i} style={styles.topicRow}>
          <Text style={styles.topicNum}>{i + 1}</Text>
          <Text style={styles.topic}>{t}</Text>
        </View>
      ))}

      <View style={styles.actions}>
        <Button label="Let’s go" variant="accent" onPress={() => router.back()} />
        <Button
          label="Show another"
          variant="ghost"
          loading={isRefetching}
          onPress={() => refetch()}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  badges: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  name: { fontFamily: fonts.headerItalic, fontSize: 34, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, marginTop: spacing.xs },
  description: { fontFamily: fonts.body, fontSize: 16, color: colors.ink, lineHeight: 23, marginTop: spacing.md },
  timeBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  timeLabel: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  time: { fontFamily: fonts.bodyMedium, fontSize: 18, color: colors.amber, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted, marginTop: spacing.lg, marginBottom: spacing.md },
  topicRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  topicNum: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.cream,
    backgroundColor: colors.forest,
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    lineHeight: 26,
    marginRight: spacing.sm,
  },
  topic: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink, lineHeight: 23 },
  actions: { marginTop: spacing.xl },
});
