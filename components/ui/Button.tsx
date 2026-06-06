import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing } from '../../lib/constants';

type Variant = 'primary' | 'accent' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const BG: Record<Variant, string> = {
  primary: colors.forest,
  accent: colors.amber,
  ghost: 'transparent',
  danger: '#C44A3A',
};

const FG: Record<Variant, string> = {
  primary: colors.cream,
  accent: colors.white,
  ghost: colors.forest,
  danger: colors.white,
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: BG[variant] },
        variant === 'ghost' && styles.ghostBorder,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={FG[variant]} />
      ) : (
        <Text style={[styles.label, { color: FG[variant] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  ghostBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
});
