import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useToggleLike, useRepost } from '../../hooks/useFeed';
import { PostCard } from '../../components/social/PostCard';
import { colors, fonts, spacing } from '../../lib/constants';

// Target of share-by-link. Shows one post (must be yours or a friend's).
export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['posts', id],
    queryFn: () => api.getPost(id!),
    enabled: Boolean(id),
  });
  const like = useToggleLike();
  const repost = useRepost();

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color={colors.forest} /></View>;
  }
  if (isError || !post) {
    return <View style={styles.centered}><Text style={styles.muted}>This post isn’t available.</Text></View>;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
    >
      <PostCard
        post={post}
        onLike={() => like.mutate({ id: post.id, liked: post.likedByMe })}
        onRepost={() => repost.mutate(post.id)}
        onShareLink={() => {}}
        onShareDM={() => router.push('/dm')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  muted: { fontFamily: fonts.body, color: colors.muted },
});
