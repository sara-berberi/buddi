import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlantSVG } from './PlantSVG';
import { CreatureSVG } from './CreatureSVG';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import type { CompanionType } from '../../types';

interface Props {
  value: CompanionType;
  onChange: (t: CompanionType) => void;
}

// Two cards, each with a live healthy preview, to pick how your garden looks.
export function CompanionPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Option
        selected={value === 'plant'}
        onPress={() => onChange('plant')}
        title="Plant"
        subtitle="Watch it bloom"
        preview={<PlantSVG health="flourishing" size={92} />}
      />
      <Option
        selected={value === 'creature'}
        onPress={() => onChange('creature')}
        title="Buddy"
        subtitle="A little creature"
        preview={<CreatureSVG health="flourishing" size={92} />}
      />
    </View>
  );
}

function Option({
  selected,
  onPress,
  title,
  subtitle,
  preview,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  subtitle: string;
  preview: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.cardSelected]}>
      {/* pointerEvents none so the animated SVG doesn't swallow the tap on web */}
      <View style={styles.preview} pointerEvents="none">{preview}</View>
      <Text style={[styles.title, selected && { color: colors.forest }]}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cardSelected: { borderColor: colors.forest, backgroundColor: colors.cream },
  preview: { height: 92, justifyContent: 'center' },
  title: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink, marginTop: spacing.sm },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
});
