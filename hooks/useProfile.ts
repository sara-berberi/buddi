import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/store';
import type { AvatarConfig } from '../types';

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: api.getProfile });
}

type ProfilePatch = Partial<{
  displayName: string;
  bio: string;
  city: string;
  avatar: AvatarConfig;
  isPrivate: boolean;
}>;

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (patch: ProfilePatch) => api.updateProfile(patch),
    onSuccess: (user) => {
      // Keep the Zustand auth user (used for avatar everywhere) in sync.
      setUser(user);
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
