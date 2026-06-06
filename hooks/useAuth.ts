import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getAccessToken } from '../lib/auth';
import { useAuthStore } from '../lib/store';

/** Auth state + actions. The user lives in Zustand; tokens in AsyncStorage. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const queryClient = useQueryClient();

  // Called once on startup: if we have a token, fetch the user.
  const hydrate = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const me = await api.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setHydrated(true);
    }
  }, [setUser, setHydrated]);

  const login = useCallback(
    async (emailOrUsername: string, password: string) => {
      const { user } = await api.login(emailOrUsername, password);
      setUser(user);
      return user;
    },
    [setUser]
  );

  const register = useCallback(
    async (input: {
      username: string;
      email: string;
      password: string;
      displayName: string;
      city?: string;
    }) => {
      const { user } = await api.register(input);
      setUser(user);
      return user;
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    queryClient.clear();
  }, [setUser, queryClient]);

  const completeOnboarding = useCallback(
    async (answers: { questionKey: string; answer: string }[]) => {
      const updated = await api.submitOnboarding(answers);
      setUser(updated);
      return updated;
    },
    [setUser]
  );

  return {
    user,
    hydrated,
    isAuthenticated: Boolean(user),
    hydrate,
    login,
    register,
    logout,
    completeOnboarding,
    setUser,
  };
}
