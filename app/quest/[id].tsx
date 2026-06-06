import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVenueQuest } from '../../hooks/useQuests';
import { useFriendships } from '../../hooks/useFriendships';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { BlobMascot } from '../../components/brand/BlobMascot';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import { CATEGORY_LABEL } from '../../lib/utils';

export default function QuestDetail() {
  // `friend` is passed when arriving from a friendship's quest cards.
  const { id, friend } = useLocalSearchParams<{ id: string; friend?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useVenueQuest(id!);
  const friends = useFriendships();
  const [picking, setPicking] = useState(false);
  const [going, setGoing] = useState(false);

  if (isLoading || !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  const { venue, suggestedTime, topics } = data.quest;

  // The actual "Let's go": accept the quest + open the DM with the venue card.
  async function go(friendId: string) {
    setPicking(false);
    setGoing(true);
    try {
      const { threadId } = await api.letsGo(venue.id, friendId);
      router.replace(`/dm/${threadId}?venue=${venue.id}`);
    } finally {
      setGoing(false);
    }
  }

  function onLetsGo() {
    if (friend) {
      go(String(friend));
    } else {
      setPicking(true); // ask which friend to plan with
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
    >
      <View style={styles.badges}>
        <Badge label={CATEGORY_LABEL[venue.category] ?? venue.category} />
        {venue.featured && <Badge label="Featured" color={colors.forest} />}
      </View>

      <Text style={styles.name}>{venue.name}</Text>
      <Text style={styles.meta}>
        {venue.neighborhood}, {venue.city} · {venue.priceRange}
      </Text>

      {venue.description ? <Text style={styles.description}>{venue.description}</Text> : null}

      <View style={styles.timeBox}>
        <Text style={styles.timeLabel}>Suggested time</Text>
        <Text style={styles.time}>{suggestedTime}</Text>
      </View>

      <Text style={styles.sectionLabel}>Talk about</Text>
      {topics.map((t, i) => (
        <View key={i} style={styles.topicRow}>
          <Text style={styles.topicNum}>{i + 1}</Text>
          <Text style={styles.topic}>{t}</Text>
        </View>
      ))}

      <View style={styles.actions}>
        <Button label="Let’s go" variant="accent" loading={going} onPress={onLetsGo} />
        <Button
          label="Show another"
          variant="ghost"
          loading={isRefetching}
          onPress={() => refetch()}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      {/* Friend picker when arriving without a friend context (Tonight tab) */}
      <Modal visible={picking} transparent animationType="slide" onRequestClose={() => setPicking(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHead}>
              <BlobMascot size={40} mood="excited" />
              <Text style={styles.sheetTitle}>Who are you going with?</Text>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {!friends.data?.length ? (
                <Text style={styles.sheetEmpty}>Add a friend first to plan a quest together.</Text>
              ) : (
                friends.data.map((f) => (
                  <Pressable key={f.id} style={styles.friendRow} onPress={() => go(f.friend.id)}>
                    <Avatar avatar={f.friend.avatar} size={40} />
                    <Text style={styles.friendName}>{f.friend.displayName}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
            <Button label="Cancel" variant="ghost" onPress={() => setPicking(false)} style={{ marginTop: spacing.sm }} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  badges: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  name: { fontFamily: fonts.headerItalic, fontSize: 34, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, marginTop: spacing.xs },
  description: { fontFamily: fonts.body, fontSize: 16, color: colors.ink, lineHeight: 23, marginTop: spacing.md },
  timeBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  timeLabel: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  time: { fontFamily: fonts.bodyMedium, fontSize: 18, color: colors.amber, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted, marginTop: spacing.lg, marginBottom: spacing.md },
  topicRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  topicNum: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.cream,
    backgroundColor: colors.forest,
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    lineHeight: 26,
    marginRight: spacing.sm,
  },
  topic: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink, lineHeight: 23 },
  actions: { marginTop: spacing.xl },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    ...(Platform.OS === 'web' ? { maxWidth: 480, alignSelf: 'center', width: '100%' } : null),
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sheetTitle: { fontFamily: fonts.headerItalic, fontSize: 22, color: colors.ink },
  sheetEmpty: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, paddingVertical: spacing.lg },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  friendName: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
});
