import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const feedKeys = {
  feed: ['feed'] as const,
  user: (id: string) => ['posts', 'user', id] as const,
  post: (id: string) => ['posts', id] as const,
};

export function useFeed() {
  return useQuery({ queryKey: feedKeys.feed, queryFn: api.getFeed });
}

export function useUserPosts(userId: string) {
  return useQuery({
    queryKey: feedKeys.user(userId),
    queryFn: () => api.getUserPosts(userId),
    enabled: Boolean(userId),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.createPost(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: feedKeys.feed }),
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? api.unlikePost(id) : api.likePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: feedKeys.feed }),
  });
}

export function useRepost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.repost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: feedKeys.feed }),
  });
}

export function useEditPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.editPost(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: feedKeys.feed }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: feedKeys.feed }),
  });
}
