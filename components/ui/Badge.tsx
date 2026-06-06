import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../../lib/constants';

interface Props {
  label: string;
  color?: string;
  textColor?: string;
}

export function Badge({ label, color = colors.amber, textColor = colors.white }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
