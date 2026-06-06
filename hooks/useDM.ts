import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ShareInput } from '../types';

export const dmKeys = {
  threads: ['dm', 'threads'] as const,
  messages: (threadId: string) => ['dm', threadId, 'messages'] as const,
};

export function useThreads() {
  return useQuery({ queryKey: dmKeys.threads, queryFn: api.getThreads });
}

// Polls for new messages every 4s while the thread screen is open.
export function useMessages(threadId: string) {
  return useQuery({
    queryKey: dmKeys.messages(threadId),
    queryFn: () => api.getMessages(threadId),
    enabled: Boolean(threadId),
    refetchInterval: 4000,
  });
}

export function useSendMessage(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { body?: string; share?: ShareInput }) =>
      api.sendMessage(threadId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dmKeys.messages(threadId) });
      qc.invalidateQueries({ queryKey: dmKeys.threads });
    },
  });
}
