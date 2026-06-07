import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDailyHistory } from '../../hooks/useDaily';
import { useAuth } from '../../hooks/useAuth';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { PersonAvatar } from '../avatar/PersonAvatar';
import { CompanionPicker } from '../plants/CompanionPicker';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import { formatTimestamp } from '../../lib/utils';
import { TAB_BAR_SPACE } from '../nav/tabBarMetrics';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, user: authUser } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: history } = useDailyHistory();
  const update = useUpdateProfile();

  if (isLoading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  const { user, stats } = profile;
  // Prefer the live auth user's avatar so edits reflect instantly.
  const avatar = authUser?.avatar ?? user.avatar;
  const isPrivate = authUser?.isPrivate ?? user.isPrivate;
  const companionType = authUser?.companionType ?? user.companionType ?? 'plant';

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: TAB_BAR_SPACE + insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/avatar')} style={styles.avatarWrap}>
          <PersonAvatar config={avatar} size={104} ring />
          <View style={styles.editPip}>
            <Icon name="edit" size={15} color={colors.white} />
          </View>
        </Pressable>
        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.handle}>@{user.username} · {user.city}</Text>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

        <Button
          label="Style your buddy"
          variant="accent"
          onPress={() => router.push('/avatar')}
          style={styles.styleBtn}
        />
      </View>

      <View style={styles.stats}>
        <Pressable style={styles.stat} onPress={() => router.push('/people')}>
          <Text style={styles.statValue}>{stats.friends}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </Pressable>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.answers}</Text>
          <Text style={styles.statLabel}>Answers</Text>
        </View>
      </View>

      <Button
        label="Find people"
        variant="primary"
        onPress={() => router.push('/people')}
        style={{ marginBottom: spacing.lg }}
      />

      {/* Companion type */}
      <Text style={styles.sectionLabel}>Your garden style</Text>
      <View style={{ marginBottom: spacing.lg }}>
        <CompanionPicker
          value={companionType}
          onChange={(t) => update.mutate({ companionType: t })}
        />
      </View>

      {/* Privacy */}
      <View style={styles.privacyRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.privacyTitleRow}>
            {isPrivate && <Icon name="lock" size={15} color={colors.ink} />}
            <Text style={styles.privacyTitle}>{isPrivate ? 'Private account' : 'Public account'}</Text>
          </View>
          <Text style={styles.privacySub}>
            {isPrivate
              ? 'Follows need your approval before they can see you.'
              : 'Anyone can find you and send a follow request.'}
          </Text>
        </View>
        <Switch
          value={isPrivate}
          onValueChange={(v) => update.mutate({ isPrivate: v })}
          trackColor={{ true: colors.forest, false: colors.border }}
          thumbColor={colors.surface}
        />
      </View>

      <Text style={styles.sectionLabel}>Your past answers</Text>
      {!history || history.length === 0 ? (
        <Text style={styles.empty}>You haven’t answered any daily questions yet.</Text>
      ) : (
        history.map((h) => (
          <View key={h.id} style={styles.historyCard}>
            <Text style={styles.historyPrompt}>{h.prompt}</Text>
            <Text style={styles.historyBody}>{h.body}</Text>
            <Text style={styles.historyTime}>{formatTimestamp(h.created_at)}</Text>
          </View>
        ))
      )}

      <Button label="Log out" variant="ghost" onPress={logout} style={{ marginTop: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatarWrap: { position: 'relative' },
  editPip: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cream,
  },
  editPipText: { color: colors.white, fontSize: 14 },
  name: { fontFamily: fonts.headerItalic, fontSize: 28, color: colors.ink, marginTop: spacing.sm },
  handle: { fontFamily: fonts.mono, fontSize: 13, color: colors.muted, marginTop: 2 },
  bio: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlign: 'center', marginTop: spacing.sm },
  styleBtn: { marginTop: spacing.md, paddingVertical: 10, minHeight: 0, paddingHorizontal: spacing.lg },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.mono, fontSize: 26, color: colors.forest },
  statLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  privacyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  privacyTitle: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  privacySub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted, marginBottom: spacing.md },
  empty: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  historyPrompt: { fontFamily: fonts.headerItalic, fontSize: 16, color: colors.muted, marginBottom: spacing.xs },
  historyBody: { fontFamily: fonts.body, fontSize: 16, color: colors.ink, lineHeight: 22 },
  historyTime: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: spacing.sm },
});
