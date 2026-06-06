import type { HealthState } from '../lib/constants';

export type { HealthState };

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string | null;
  city: string;
  avatarEmoji: string;
  onboarded: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface FriendSummary {
  id: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
}

export interface Friendship {
  id: string;
  status: 'pending' | 'accepted';
  lastContactAt: string | null;
  daysSinceContact: number | null;
  health: HealthState;
  stemColor: string;
  friend: FriendSummary;
  history?: ContactEvent[];
}

export interface ContactEvent {
  id: string;
  kind: 'hangout' | 'quest' | 'miss_you';
  note: string | null;
  occurred_at: string;
}

export interface DailyQuestion {
  id: string;
  prompt: string;
}

export interface DailyAnswer {
  id: string;
  body: string;
  createdAt?: string;
  created_at?: string;
}

export interface FriendAnswer {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
}

export interface DailyToday {
  question: DailyQuestion;
  answered: boolean;
  myAnswer: DailyAnswer | null;
  friendsAnswers: FriendAnswer[];
}

export interface HistoryItem {
  id: string;
  body: string;
  created_at: string;
  prompt: string;
}

export type VenueCategory = 'cafe' | 'food' | 'outdoor' | 'culture';

export interface Venue {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  category: VenueCategory;
  priceRange: '$' | '$$' | '$$$';
  description: string | null;
  photoUrl: string | null;
  featured: boolean;
}

export interface QuestCard {
  venue: Venue;
  suggestedTime: string;
  topics: string[];
}
