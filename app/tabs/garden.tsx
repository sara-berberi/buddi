import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFriendships, usePendingInvites, useInvite, useAcceptInvite } from '../../hooks/useFriendships';
import { PlantSVG } from '../../components/plants/PlantSVG';
import { Button } from '../../components/ui/Button';
import { colors, fonts, radius, spacing, HEALTH_LABEL } from '../../lib/constants';
import { relativeDays } from '../../lib/utils';
import type { Friendship } from '../../types';

export default function GardenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: friendships, isLoading } = useFriendships();
  const { data: pending } = usePendingInvites();
  const invite = useInvite();
  const accept = useAcceptInvite();

  const [username, setUsername] = useState('');
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const needsAttention =
    friendships?.filter((f) => f.health === 'wilting' || f.health === 'critical') ?? [];

  async function sendInvite() {
    setInviteMsg(null);
    try {
      await invite.mutateAsync(username.trim());
      setInviteMsg(`Invite sent to @${username.trim()}`);
      setUsername('');
    } catch (e) {
      setInviteMsg(e instanceof Error ? e.message : 'Could not send invite');
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={styles.title}>Your Garden</Text>

      {needsAttention.length > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            🥀 {needsAttention.length} friendship{needsAttention.length > 1 ? 's are' : ' is'} wilting. Time for a quest?
          </Text>
        </View>
      )}

      {pending && pending.length > 0 && (
        <View style={styles.pendingBox}>
          <Text style={styles.pendingTitle}>Pending invites</Text>
          {pending.map((p) => (
            <View key={p.id} style={styles.pendingRow}>
              <Text style={styles.pendingName}>{p.friend.displayName} (@{p.friend.username})</Text>
              <Button label="Accept" variant="primary" onPress={() => accept.mutate(p.id)} style={{ paddingVertical: 8, minHeight: 0 }} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.inviteBox}>
        <TextInput
          style={styles.inviteInput}
          value={username}
          onChangeText={setUsername}
          placeholder="Add a friend by username"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button label="Add" variant="accent" loading={invite.isPending} disabled={!username.trim()} onPress={sendInvite} style={{ minHeight: 0, paddingVertical: 12 }} />
      </View>
      {inviteMsg && <Text style={styles.inviteMsg}>{inviteMsg}</Text>}

      {!friendships || friendships.length === 0 ? (
        <View style={styles.empty}>
          <PlantSVG health="good" size={120} />
          <Text style={styles.emptyText}>Your garden is empty. Add a friend to plant your first seed.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {friendships.map((f) => (
            <PlantTile key={f.id} friendship={f} onPress={() => router.push(`/friendship/${f.id}`)} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function PlantTile({ friendship, onPress }: { friendship: Friendship; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}>
      <PlantSVG health={friendship.health} stemColor={friendship.stemColor} size={104} />
      <Text style={styles.tileName} numberOfLines={1}>
        {friendship.friend.displayName}
      </Text>
      <Text style={styles.tileMeta}>{relativeDays(friendship.daysSinceContact)}</Text>
      <Text style={[styles.tileHealth, { color: friendship.stemColor }]}>
        {HEALTH_LABEL[friendship.health]}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  title: { fontFamily: fonts.headerItalic, fontSize: 32, color: colors.ink, marginBottom: spacing.md },
  banner: {
    backgroundColor: '#F6E4DC',
    borderColor: '#C44A3A',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: '#8A3326' },
  pendingBox: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  pendingTitle: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, marginBottom: spacing.sm },
  pendingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  pendingName: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, flex: 1 },
  inviteBox: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.xs },
  inviteInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  inviteMsg: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: spacing.md },
  tile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tileName: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink, marginTop: spacing.sm },
  tileMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 2 },
  tileHealth: { fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: spacing.xs },
  empty: { alignItems: 'center', marginTop: spacing.xxl },
  emptyText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.lg },
});
