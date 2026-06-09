import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/store';

export function useCoins() {
  return useQuery({ queryKey: ['coins'], queryFn: api.getCoins });
}

export function useUnlockVenue() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (venueId: string) => api.unlockVenue(venueId),
    onSuccess: (res) => {
      // Keep the wallet balance fresh everywhere.
      if (user) setUser({ ...user, coins: res.balance });
      qc.invalidateQueries({ queryKey: ['coins'] });
      qc.invalidateQueries({ queryKey: ['quests'] });
    },
  });
}
