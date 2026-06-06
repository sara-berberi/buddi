import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const dailyKeys = {
  today: ['daily', 'today'] as const,
  history: ['daily', 'history'] as const,
};

export function useToday() {
  return useQuery({ queryKey: dailyKeys.today, queryFn: api.getToday });
}

export function usePostAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.postAnswer(body),
    onSuccess: () => {
      // Refetch today so friends' answers are revealed after posting.
      qc.invalidateQueries({ queryKey: dailyKeys.today });
      qc.invalidateQueries({ queryKey: dailyKeys.history });
    },
  });
}

export function useDailyHistory() {
  return useQuery({ queryKey: dailyKeys.history, queryFn: api.getDailyHistory });
}
