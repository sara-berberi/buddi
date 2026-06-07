import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useFeed, useCreatePost, useToggleLike, useRepost } from '../../hooks/useFeed';
import { useFriendships } from '../../hooks/useFriendships';
import { api } from '../../lib/api';
import { PostCard } from '../social/PostCard';
import { BlobMascot } from '../brand/BlobMascot';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import { TAB_BAR_SPACE } from '../nav/tabBarMetrics';

const APP_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const feed = useFeed();
  const friends = useFriendships();
  const createPost = useCreatePost();
  const like = useToggleLike();
  const repost = useRepost();

  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  async function post() {
    if (!draft.trim()) return;
    await createPost.mutateAsync(draft.trim());
    setDraft('');
    flash('Posted! 🎉');
  }

  async function shareLink(postId: string) {
    const link = `${APP_URL}/post/${postId}`;
    await Clipboard.setStringAsync(link);
    flash('Link copied 🔗');
  }

  async function sendToFriend(friendId: string) {
    if (!sharePostId) return;
    const postId = sharePostId;
    setSharePostId(null);
    const threadId = await api.openThread(friendId);
    await api.sendMessage(threadId, { share: { kind: 'post', postId } });
    router.push(`/dm/${threadId}`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Header with mascot + DM button */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.brand}>
          <BlobMascot size={34} mood="happy" />
          <Text style={styles.brandText}>Buddi</Text>
        </View>
        <Pressable onPress={() => router.push('/dm')} style={styles.dmBtn} hitSlop={8}>
          <Icon name="mail" size={20} color={colors.forest} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_SPACE + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
          />
          <View style={styles.composerRow}>
            <Text style={styles.counter}>{draft.length}/500</Text>
            <Button
              label="Post"
              variant="accent"
              loading={createPost.isPending}
              disabled={!draft.trim()}
              onPress={post}
              style={styles.postBtn}
            />
          </View>
        </View>

        {feed.isLoading ? (
          <ActivityIndicator color={colors.forest} style={{ marginTop: spacing.xl }} />
        ) : !feed.data?.length ? (
          <View style={styles.empty}>
            <BlobMascot size={120} color={colors.sprout} mood="sleepy" />
            <Text style={styles.emptyText}>Quiet in here. Post a status or add friends to fill your feed.</Text>
          </View>
        ) : (
          feed.data.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onLike={() => like.mutate({ id: p.id, liked: p.likedByMe })}
              onRepost={() => repost.mutate(p.id)}
              onShareLink={() => shareLink(p.repostOf?.id ?? p.id)}
              onShareDM={() => setSharePostId(p.repostOf?.id ?? p.id)}
            />
          ))
        )}
      </ScrollView>

      {toast && (
        <View style={[styles.toast, { bottom: TAB_BAR_SPACE + insets.bottom + spacing.md }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Share-to-DM friend picker */}
      <Modal visible={Boolean(sharePostId)} transparent animationType="slide" onRequestClose={() => setSharePostId(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSharePostId(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Send to…</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {!friends.data?.length ? (
                <Text style={styles.sheetEmpty}>Add a friend first to share in DMs.</Text>
              ) : (
                friends.data.map((f) => (
                  <Pressable key={f.id} style={styles.friendRow} onPress={() => sendToFriend(f.friend.id)}>
                    <Avatar avatar={f.friend.avatar} size={40} />
                    <Text style={styles.friendName}>{f.friend.displayName}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
            <Button label="Cancel" variant="ghost" onPress={() => setSharePostId(null)} style={{ marginTop: spacing.sm }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandText: { fontFamily: fonts.headerItalic, fontSize: 26, color: colors.ink },
  dmBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dmGlyph: { fontSize: 18 },
  content: { paddingHorizontal: spacing.lg },
  composer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  input: { fontFamily: fonts.body, fontSize: 17, color: colors.ink, minHeight: 56, textAlignVertical: 'top' },
  composerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  counter: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
  postBtn: { minHeight: 0, paddingVertical: 10, paddingHorizontal: spacing.lg },
  empty: { alignItems: 'center', marginTop: spacing.xxl },
  emptyText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.lg },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.forest,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  toastText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.cream },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    ...(Platform.OS === 'web' ? { maxWidth: 480, alignSelf: 'center', width: '100%' } : null),
  },
  sheetTitle: { fontFamily: fonts.headerItalic, fontSize: 22, color: colors.ink, marginBottom: spacing.md },
  sheetEmpty: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, paddingVertical: spacing.lg },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  friendName: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
});
