import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const friendshipKeys = {
  all: ['friendships'] as const,
  detail: (id: string) => ['friendships', id] as const,
  pending: ['friendships', 'pending'] as const,
  suggestions: ['friendships', 'suggestions'] as const,
  search: (q: string) => ['users', 'search', q] as const,
};

export function useSuggestions() {
  return useQuery({ queryKey: friendshipKeys.suggestions, queryFn: api.getSuggestions });
}

/** Search-as-you-type for people to follow. Only runs for queries >= 2 chars. */
export function useUserSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: friendshipKeys.search(q),
    queryFn: () => api.searchUsers(q),
    enabled: q.length >= 2,
    staleTime: 10_000,
  });
}

export function useFriendships() {
  return useQuery({ queryKey: friendshipKeys.all, queryFn: api.getFriendships });
}

export function usePendingInvites() {
  return useQuery({ queryKey: friendshipKeys.pending, queryFn: api.getPending });
}

export function useFriendship(id: string) {
  return useQuery({
    queryKey: friendshipKeys.detail(id),
    queryFn: () => api.getFriendship(id),
    enabled: Boolean(id),
  });
}

export function useInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => api.invite(username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: friendshipKeys.all });
      qc.invalidateQueries({ queryKey: friendshipKeys.suggestions });
    },
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.acceptFriendship(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: friendshipKeys.all });
      qc.invalidateQueries({ queryKey: friendshipKeys.pending });
    },
  });
}

export function useMarkContact(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => api.markContact(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: friendshipKeys.detail(id) });
      qc.invalidateQueries({ queryKey: friendshipKeys.all });
    },
  });
}

export function useMissYou(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.missYou(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: friendshipKeys.detail(id) }),
  });
}
