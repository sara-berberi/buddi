import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFriendships,
  usePendingInvites,
  useAcceptInvite,
  useInvite,
  useSuggestions,
} from '../hooks/useFriendships';
import { Avatar } from '../components/ui/Avatar';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { colors, fonts, radius, spacing } from '../lib/constants';
import type { AvatarConfig } from '../types';

type Tab = 'friends' | 'requests' | 'suggested';

export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('friends');

  const friends = useFriendships();
  const pending = usePendingInvites();
  const suggestions = useSuggestions();
  const accept = useAcceptInvite();
  const invite = useInvite();
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  const counts = {
    friends: friends.data?.length ?? 0,
    requests: pending.data?.length ?? 0,
    suggested: suggestions.data?.length ?? 0,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Top tab bar (tap to switch) */}
      <View style={styles.tabs}>
        {(['friends', 'requests', 'suggested'] as Tab[]).map((t) => {
          const active = tab === t;
          const label = t[0].toUpperCase() + t.slice(1);
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
                {counts[t] > 0 ? ` · ${counts[t]}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {tab === 'friends' && (
          friends.isLoading ? <Loading /> : !friends.data?.length ? (
            <Empty text="No friends yet. Check Suggested to find people." />
          ) : (
            friends.data.map((f) => (
              <PersonRow
                key={f.id}
                avatar={f.friend.avatar}
                name={f.friend.displayName}
                handle={f.friend.username}
                onPress={() => router.push(`/friendship/${f.id}`)}
                right={
                  <View style={styles.friendTagRow}>
                    <Icon name="garden" size={13} color={colors.muted} />
                    <Text style={styles.friendTag}>{f.health}</Text>
                  </View>
                }
              />
            ))
          )
        )}

        {tab === 'requests' && (
          pending.isLoading ? <Loading /> : !pending.data?.length ? (
            <Empty text="No follow requests right now." />
          ) : (
            pending.data.map((p) => (
              <PersonRow
                key={p.id}
                avatar={p.friend.avatar}
                name={p.friend.displayName}
                handle={p.friend.username}
                right={
                  <Button
                    label="Accept"
                    variant="primary"
                    onPress={() => accept.mutate(p.id)}
                    style={styles.smallBtn}
                  />
                }
              />
            ))
          )
        )}

        {tab === 'suggested' && (
          suggestions.isLoading ? <Loading /> : !suggestions.data?.length ? (
            <Empty text="No suggestions yet. Add a few friends and we’ll find more." />
          ) : (
            suggestions.data.map((s) => (
              <PersonRow
                key={s.id}
                avatar={s.avatar}
                name={s.displayName}
                handle={s.username}
                subtitle={s.reason}
                right={
                  <Button
                    label={requested[s.id] ? 'Requested' : 'Follow'}
                    variant={requested[s.id] ? 'ghost' : 'accent'}
                    disabled={requested[s.id] || invite.isPending}
                    onPress={async () => {
                      try {
                        await invite.mutateAsync(s.username);
                        setRequested((r) => ({ ...r, [s.id]: true }));
                      } catch {
                        /* surfaced elsewhere; keep row stable */
                      }
                    }}
                    style={styles.smallBtn}
                  />
                }
              />
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

function PersonRow({
  avatar,
  name,
  handle,
  subtitle,
  right,
  onPress,
}: {
  avatar: AvatarConfig;
  name: string;
  handle: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && onPress && { opacity: 0.85 }]}>
      <Avatar avatar={avatar} size={48} />
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.handle}>@{handle}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

function Loading() {
  return <ActivityIndicator color={colors.forest} style={{ marginTop: spacing.xl }} />;
}
function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm, backgroundColor: colors.cream },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  tabText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  tabTextActive: { color: colors.cream },
  content: { padding: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  info: { flex: 1, marginLeft: spacing.sm },
  name: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  handle: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted, marginTop: 1 },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.amber, marginTop: 2 },
  friendTagRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  friendTag: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
  smallBtn: { minHeight: 0, paddingVertical: 10, paddingHorizontal: spacing.md },
  empty: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: spacing.xxl },
});
