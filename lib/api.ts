// All API calls live here — edit here first (per CLAUDE.md).
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from './auth';
import type {
  AuthResponse,
  AvatarConfig,
  DailyAnswer,
  DailyToday,
  Friendship,
  HistoryItem,
  QuestCard,
  SuggestedUser,
  User,
  UserCard,
  VenueCategory,
} from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean; // attach access token (default true)
  _retry?: boolean; // internal: prevents infinite refresh loop
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, _retry = false } = opts;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // Transparent refresh on a single 401.
  if (res.status === 401 && auth && !_retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, { ...opts, _retry: true });
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error ?? 'Request failed');
  }
  return data as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await clearTokens();
      return false;
    }
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    await setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ---- Auth -----------------------------------------------------------------
export const api = {
  async register(input: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    city?: string;
  }): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: input,
      auth: false,
    });
    await setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { emailOrUsername, password },
      auth: false,
    });
    await setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = await getRefreshToken();
    try {
      await request<void>('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        auth: false,
      });
    } finally {
      await clearTokens();
    }
  },

  async me(): Promise<User> {
    const data = await request<{ user: User }>('/auth/me');
    return data.user;
  },

  async submitOnboarding(
    answers: { questionKey: string; answer: string }[]
  ): Promise<User> {
    const data = await request<{ user: User }>('/auth/onboarding', {
      method: 'POST',
      body: { answers },
    });
    return data.user;
  },

  // ---- Users --------------------------------------------------------------
  async getProfile(): Promise<{ user: User; stats: { friends: number; answers: number } }> {
    return request('/users/me');
  },

  async updateProfile(
    patch: Partial<{
      displayName: string;
      bio: string;
      city: string;
      avatar: AvatarConfig;
      isPrivate: boolean;
    }>
  ) {
    const data = await request<{ user: User }>('/users/me', { method: 'PATCH', body: patch });
    return data.user;
  },

  async searchUsers(q: string): Promise<UserCard[]> {
    const data = await request<{ users: UserCard[] }>(`/users/search?q=${encodeURIComponent(q)}`);
    return data.users;
  },

  async getSuggestions(): Promise<SuggestedUser[]> {
    const data = await request<{ suggestions: SuggestedUser[] }>('/friendships/suggestions');
    return data.suggestions;
  },

  // ---- Friendships --------------------------------------------------------
  async getFriendships(): Promise<Friendship[]> {
    const data = await request<{ friendships: Friendship[] }>('/friendships');
    return data.friendships;
  },

  async getPending(): Promise<Friendship[]> {
    const data = await request<{ pending: Friendship[] }>('/friendships/pending');
    return data.pending;
  },

  async getFriendship(id: string): Promise<Friendship> {
    const data = await request<{ friendship: Friendship }>(`/friendships/${id}`);
    return data.friendship;
  },

  async invite(username: string): Promise<{ id: string; status: string }> {
    return request('/friendships/invite', { method: 'POST', body: { username } });
  },

  async acceptFriendship(id: string): Promise<{ id: string; status: string }> {
    return request(`/friendships/${id}/accept`, { method: 'POST' });
  },

  async markContact(id: string, note?: string): Promise<{ friendship: Friendship }> {
    return request(`/friendships/${id}/contact`, { method: 'POST', body: { note } });
  },

  async missYou(id: string): Promise<{ ok: boolean }> {
    return request(`/friendships/${id}/miss-you`, { method: 'POST' });
  },

  // ---- Daily --------------------------------------------------------------
  async getToday(): Promise<DailyToday> {
    return request('/daily/today');
  },

  async postAnswer(body: string): Promise<DailyAnswer> {
    return request('/daily/answer', { method: 'POST', body: { body } });
  },

  async getDailyHistory(): Promise<HistoryItem[]> {
    const data = await request<{ history: HistoryItem[] }>('/daily/history');
    return data.history;
  },

  // ---- Quests -------------------------------------------------------------
  async getQuests(category?: VenueCategory): Promise<{ city: string; quests: QuestCard[] }> {
    const q = category ? `?category=${category}` : '';
    return request(`/quests${q}`);
  },

  async getFriendshipQuests(id: string): Promise<{ quests: QuestCard[] }> {
    return request(`/quests/friendship/${id}`);
  },

  async getVenueQuest(venueId: string): Promise<{ quest: QuestCard }> {
    return request(`/quests/venue/${venueId}`);
  },
};
