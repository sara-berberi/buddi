import type { HealthState } from '../lib/constants';

export type { HealthState };

export interface AvatarConfig {
  skin: string;
  hair: string;
  hairColor: string;
  accessory: string;
  bg: string;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: '#E8B894',
  hair: 'short',
  hairColor: '#3A2A1A',
  accessory: 'none',
  bg: '#C9E4D3',
};

export type CompanionType = 'plant' | 'creature';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string | null;
  city: string;
  avatarEmoji: string;
  avatar: AvatarConfig;
  isPrivate: boolean;
  companionType: CompanionType;
  onboarded: boolean;
}

/** Lightweight user shown in search / friends / suggestions. */
export interface UserCard {
  id: string;
  username: string;
  displayName: string;
  city: string;
  avatarEmoji: string;
  avatar: AvatarConfig;
  isPrivate: boolean;
}

export interface SuggestedUser extends UserCard {
  reason: string;
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
  avatar: AvatarConfig;
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
  avatar_config: AvatarConfig | null;
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

// ---- Social ---------------------------------------------------------------
export interface PostAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar: AvatarConfig;
}

export interface Post {
  id: string;
  body: string | null;
  createdAt: string;
  likeCount: number;
  repostCount: number;
  likedByMe: boolean;
  author: PostAuthor;
  repostOf: {
    id: string;
    body: string | null;
    createdAt: string;
    author: PostAuthor;
  } | null;
}

// ---- DM -------------------------------------------------------------------
export interface DmThreadSummary {
  id: string;
  lastMessageAt: string | null;
  preview: string;
  friend: PostAuthor;
}

export type DmShare =
  | { kind: 'post'; postId: string; postBody: string | null; postAuthor: string | null }
  | {
      kind: 'venue';
      venueId: string;
      venueName: string;
      neighborhood: string;
      category: VenueCategory;
    };

export interface DmMessage {
  id: string;
  senderId: string;
  body: string | null;
  createdAt: string;
  share: DmShare | null;
}

export type ShareInput =
  | { kind: 'post'; postId: string }
  | { kind: 'venue'; venueId: string };
