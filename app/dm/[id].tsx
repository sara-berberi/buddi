import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMessages, useSendMessage } from '../../hooks/useDM';
import { useAuth } from '../../hooks/useAuth';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import { CATEGORY_LABEL } from '../../lib/utils';
import type { DmMessage } from '../../types';

export default function DmThread() {
  const { id, venue } = useLocalSearchParams<{ id: string; venue?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(id!);
  const send = useSendMessage(id!);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const sentVenue = useRef(false);

  // If opened from "Let's go" with a venue, auto-send the venue card once.
  useEffect(() => {
    if (venue && !sentVenue.current) {
      sentVenue.current = true;
      send.mutate({ share: { kind: 'venue', venueId: String(venue) } });
    }
  }, [venue, send]);

  useEffect(() => {
    // Scroll to bottom when messages change.
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages?.length]);

  async function submit() {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    await send.mutateAsync({ body });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.forest} style={{ marginTop: spacing.xl }} />
        ) : (
          messages?.map((m) => (
            <Bubble key={m.id} message={m} mine={m.senderId === user?.id} onOpenVenue={(vid) => router.push(`/quest/${vid}`)} />
          ))
        )}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message…"
          placeholderTextColor={colors.muted}
          multiline
          onSubmitEditing={submit}
        />
        <Pressable onPress={submit} style={[styles.sendBtn, !draft.trim() && { opacity: 0.4 }]} disabled={!draft.trim()}>
          <Text style={styles.sendGlyph}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({
  message,
  mine,
  onOpenVenue,
}: {
  message: DmMessage;
  mine: boolean;
  onOpenVenue: (venueId: string) => void;
}) {
  return (
    <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        {message.body ? (
          <Text style={[styles.bubbleText, mine && { color: colors.cream }]}>{message.body}</Text>
        ) : null}

        {message.share?.kind === 'venue' && (
          <Pressable style={styles.shareCard} onPress={() => onOpenVenue(message.share!.kind === 'venue' ? message.share!.venueId : '')}>
            <Text style={styles.shareKicker}>✦ Let’s go</Text>
            <Text style={styles.shareTitle}>{message.share.venueName}</Text>
            <Text style={styles.shareMeta}>
              {message.share.neighborhood} · {CATEGORY_LABEL[message.share.category] ?? message.share.category}
            </Text>
            <Text style={styles.shareCta}>Tap to view quest →</Text>
          </Pressable>
        )}

        {message.share?.kind === 'post' && (
          <View style={styles.shareCard}>
            <Text style={styles.shareKicker}>🔗 Shared post</Text>
            {message.share.postAuthor ? <Text style={styles.shareTitle}>{message.share.postAuthor}</Text> : null}
            <Text style={styles.shareMeta} numberOfLines={3}>{message.share.postBody}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.xs },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.xs },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, padding: spacing.sm, paddingHorizontal: spacing.md },
  mine: { backgroundColor: colors.forest, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: fonts.body, fontSize: 16, color: colors.ink, lineHeight: 22 },
  shareCard: {
    marginTop: spacing.xs,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    minWidth: 200,
  },
  shareKicker: { fontFamily: fonts.mono, fontSize: 10, color: colors.amber, textTransform: 'uppercase', letterSpacing: 0.5 },
  shareTitle: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, marginTop: 2 },
  shareMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  shareCta: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.amber, marginTop: spacing.xs },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    maxHeight: 120,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bubble, alignItems: 'center', justifyContent: 'center' },
  sendGlyph: { color: colors.white, fontSize: 18 },
});
