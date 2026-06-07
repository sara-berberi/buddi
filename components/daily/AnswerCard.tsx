import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import { formatTimestamp } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import type { AvatarConfig } from '../../types';

interface Props {
  name: string;
  emoji?: string;
  avatar?: AvatarConfig | null;
  body: string;
  timestamp: string;
  isMine?: boolean; // shows the lock icon (uneditable)
}

export function AnswerCard({ name, emoji, avatar, body, timestamp, isMine }: Props) {
  return (
    <View style={[styles.card, isMine && styles.mine]}>
      <View style={styles.header}>
        <Avatar avatar={avatar} emoji={emoji} name={name} size={36} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{isMine ? 'You' : name}</Text>
          <Text style={styles.time}>{formatTimestamp(timestamp)}</Text>
        </View>
        {isMine && <Icon name="lock" size={15} color={colors.muted} />}
      </View>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  mine: {
    borderColor: colors.forest,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerText: { flex: 1, marginLeft: spacing.sm },
  name: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  time: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
  lock: { fontSize: 14 },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink,
  },
});
