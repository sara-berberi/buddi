import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import { CATEGORY_LABEL } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import type { QuestCard as QuestCardData } from '../../types';

interface Props {
  quest: QuestCardData;
  onPress?: () => void;
}

export function QuestCard({ quest, onPress }: Props) {
  const { venue, suggestedTime, topics } = quest;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <Badge label={CATEGORY_LABEL[venue.category] ?? venue.category} />
        {venue.featured && <Badge label="Featured" color={colors.forest} />}
      </View>

      <Text style={styles.name}>{venue.name}</Text>
      <Text style={styles.meta}>
        {venue.neighborhood} · {venue.priceRange}
      </Text>

      <Text style={styles.time}>{suggestedTime}</Text>

      {topics.length > 0 && (
        <View style={styles.topics}>
          <Text style={styles.topicLabel}>Talk about</Text>
          {topics.map((t, i) => (
            <Text key={i} style={styles.topic}>
              · {t}
            </Text>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.9 },
  topRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  name: {
    fontFamily: fonts.headerItalic,
    fontSize: 22,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  time: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.amber,
    marginTop: spacing.sm,
  },
  topics: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  topicLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  topic: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
  },
});
