import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../lib/constants';
import { PersonAvatar } from '../avatar/PersonAvatar';
import type { AvatarConfig } from '../../types';

interface Props {
  avatar?: AvatarConfig | null;
  emoji?: string;
  name?: string;
  size?: number;
}

// Renders the styleable person avatar when a config is present; otherwise
// falls back to emoji/initial. Used everywhere a user is shown.
export function Avatar({ avatar, emoji, name, size = 44 }: Props) {
  if (avatar) {
    return <PersonAvatar config={avatar} size={size} ring />;
  }
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
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
