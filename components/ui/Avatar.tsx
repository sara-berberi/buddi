import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../lib/constants';

interface Props {
  emoji?: string;
  name?: string;
  size?: number;
}

export function Avatar({ emoji, name, size = 44 }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={{ fontSize: size * 0.5, fontFamily: fonts.body }}>
        {emoji ?? name?.[0]?.toUpperCase() ?? '🌱'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
