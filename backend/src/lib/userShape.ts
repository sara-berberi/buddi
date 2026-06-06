// Single source of truth for the user row -> API shape, including the new
// avatar_config and is_private fields. Used by auth, users, friendships, daily.

export interface UserRow {
  id: string;
  username: string;
  email: string;
  display_name: string;
  bio: string | null;
  city: string;
  avatar_emoji: string;
  avatar_config: AvatarConfig | null;
  is_private: boolean;
  onboarded: boolean;
}

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

const SKIN = ['#FDE0C8', '#F2C49B', '#E8B894', '#C68642', '#8D5524', '#5C3A21'];
const HAIR = ['short', 'long', 'bun', 'curly', 'buzz', 'bald'];
const ACCESSORY = ['none', 'glasses', 'sunglasses', 'earrings', 'hat'];

/** Validate/normalize an incoming avatar config; falls back to defaults. */
export function sanitizeAvatar(input: unknown): AvatarConfig {
  const a = (input ?? {}) as Partial<AvatarConfig>;
  const hex = (v: unknown, fb: string) =>
    typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fb;
  return {
    skin: SKIN.includes(a.skin as string) ? (a.skin as string) : hex(a.skin, DEFAULT_AVATAR.skin),
    hair: HAIR.includes(a.hair as string) ? (a.hair as string) : DEFAULT_AVATAR.hair,
    hairColor: hex(a.hairColor, DEFAULT_AVATAR.hairColor),
    accessory: ACCESSORY.includes(a.accessory as string)
      ? (a.accessory as string)
      : DEFAULT_AVATAR.accessory,
    bg: hex(a.bg, DEFAULT_AVATAR.bg),
  };
}

/** Full profile (own user). */
export function publicUser(u: UserRow) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    displayName: u.display_name,
    bio: u.bio,
    city: u.city,
    avatarEmoji: u.avatar_emoji,
    avatar: u.avatar_config ?? DEFAULT_AVATAR,
    isPrivate: u.is_private,
    onboarded: u.onboarded,
  };
}

/** Lightweight shape for search/suggestions/friends lists (no email). */
export function userCard(u: Partial<UserRow> & { id: string }) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    city: u.city,
    avatarEmoji: u.avatar_emoji,
    avatar: u.avatar_config ?? DEFAULT_AVATAR,
    isPrivate: u.is_private ?? false,
  };
}
