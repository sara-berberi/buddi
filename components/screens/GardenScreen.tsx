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
import {
  useFriendships,
  usePendingInvites,
  useInvite,
  useAcceptInvite,
  useUserSearch,
} from '../../hooks/useFriendships';
import { Companion } from '../plants/Companion';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { BuddiesIcon } from '../avatar/BuddiesIcon';
import { useAuth } from '../../hooks/useAuth';
import { colors, fonts, radius, spacing, HEALTH_LABEL } from '../../lib/constants';
import { relativeDays } from '../../lib/utils';
import { TAB_BAR_SPACE } from '../nav/tabBarMetrics';
import type { CompanionType, Friendship, UserCard } from '../../types';

export default function GardenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const companionType: CompanionType = user?.companionType ?? 'plant';
  const { data: friendships, isLoading } = useFriendships();
  const { data: pending } = usePendingInvites();
  const invite = useInvite();
  const accept = useAcceptInvite();

  const [query, setQuery] = useState('');
  const search = useUserSearch(query);
  // Track who we've just sent a request to so the button flips immediately.
  const [requested, setRequested] = useState<Record<string, boolean>>({});
  const [searchError, setSearchError] = useState<string | null>(null);

  const needsAttention =
    friendships?.filter((f) => f.health === 'wilting' || f.health === 'critical') ?? [];

  async function follow(user: UserCard) {
    setSearchError(null);
    try {
      await invite.mutateAsync(user.username);
      setRequested((r) => ({ ...r, [user.id]: true }));
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Could not send request');
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  const searching = query.trim().length >= 2;

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: TAB_BAR_SPACE + insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Your Garden</Text>

      {/* Search bar — find & follow people */}
      <View style={styles.searchBar}>
        <Icon name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search people to follow"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Icon name="close" size={16} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* Search results take over the screen while typing */}
      {searching ? (
        <View style={styles.results}>
          {search.isLoading ? (
            <ActivityIndicator color={colors.forest} style={{ marginTop: spacing.lg }} />
          ) : search.data && search.data.length > 0 ? (
            search.data.map((u) => (
              <View key={u.id} style={styles.resultRow}>
                <Avatar avatar={u.avatar} emoji={u.avatarEmoji} name={u.displayName} size={44} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{u.displayName}</Text>
                  <Text style={styles.resultHandle}>@{u.username}</Text>
                </View>
                <Button
                  label={requested[u.id] ? 'Requested' : 'Follow'}
                  variant={requested[u.id] ? 'ghost' : 'accent'}
                  disabled={requested[u.id] || invite.isPending}
                  onPress={() => follow(u)}
                  style={styles.followBtn}
                />
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No one found for “{query.trim()}”.</Text>
          )}
          {searchError && <Text style={styles.error}>{searchError}</Text>}
        </View>
      ) : (
        <>
          {needsAttention.length > 0 && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                🥀 {needsAttention.length} friendship{needsAttention.length > 1 ? 's are' : ' is'} wilting. Time for a quest?
              </Text>
            </View>
          )}

          {pending && pending.length > 0 && (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingTitle}>Follow requests</Text>
              {pending.map((p) => (
                <View key={p.id} style={styles.pendingRow}>
                  <Avatar avatar={p.friend.avatar} emoji={p.friend.avatarEmoji} name={p.friend.displayName} size={36} />
                  <Text style={styles.pendingName} numberOfLines={1}>
                    {p.friend.displayName} <Text style={styles.pendingHandle}>@{p.friend.username}</Text>
                  </Text>
                  <Button
                    label="Accept"
                    variant="primary"
                    onPress={() => accept.mutate(p.id)}
                    style={styles.acceptBtn}
                  />
                </View>
              ))}
            </View>
          )}

          {!friendships || friendships.length === 0 ? (
            <View style={styles.emptyGarden}>
              <BuddiesIcon size={140} />
              <Text style={styles.emptyText}>
                Your garden is empty. Find your buddies to plant your first seed.
              </Text>
              <Button
                label="Find people"
                variant="primary"
                onPress={() => router.push('/people')}
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : (
            <View style={styles.grid}>
              {friendships.map((f) => (
                <PlantTile
                  key={f.id}
                  friendship={f}
                  companionType={companionType}
                  onPress={() => router.push(`/friendship/${f.id}`)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function PlantTile({
  friendship,
  companionType,
  onPress,
}: {
  friendship: Friendship;
  companionType: CompanionType;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}>
      <Companion type={companionType} health={friendship.health} stemColor={friendship.stemColor} size={104} />
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
  content: { paddingHorizontal: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  title: { fontFamily: fonts.headerItalic, fontSize: 32, color: colors.ink, marginBottom: spacing.md },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },

  results: { marginTop: spacing.xs },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultInfo: { flex: 1, marginLeft: spacing.sm },
  resultName: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  resultHandle: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted, marginTop: 1 },
  followBtn: { minHeight: 0, paddingVertical: 10, paddingHorizontal: spacing.md },

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
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  pendingName: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, flex: 1 },
  pendingHandle: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  acceptBtn: { minHeight: 0, paddingVertical: 8, paddingHorizontal: spacing.md },

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

  emptyGarden: { alignItems: 'center', marginTop: spacing.xxl },
  emptyText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.lg },
  empty: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: spacing.lg },
  error: { fontFamily: fonts.body, fontSize: 13, color: '#C44A3A', marginTop: spacing.sm, textAlign: 'center' },
});
