// Zustand holds ONLY the auth user (minimal client state). Everything else is
// server state via TanStack Query.
import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  hydrated: boolean; // have we checked storage/token on startup yet?
  setUser: (user: User | null) => void;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
