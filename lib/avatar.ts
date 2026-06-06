// Avatar option palettes — shared by the PersonAvatar renderer and the editor.
// Keep in sync with backend lib/userShape.ts (sanitizeAvatar).
import type { AvatarConfig } from '../types';

export const SKIN_TONES = ['#FDE0C8', '#F2C49B', '#E8B894', '#C68642', '#8D5524', '#5C3A21'];

export const HAIR_STYLES = ['short', 'long', 'bun', 'curly', 'buzz', 'bald'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const HAIR_COLORS = ['#1A1310', '#3A2A1A', '#6B4423', '#A8702E', '#C9A24B', '#B0B0B0', '#D65A5A'];

export const ACCESSORIES = ['none', 'glasses', 'sunglasses', 'earrings', 'hat'] as const;
export type Accessory = (typeof ACCESSORIES)[number];

// Cute, soft background colors.
export const BG_COLORS = ['#C9E4D3', '#F5D6C6', '#D6E2F5', '#F5E7C6', '#E7D6F5', '#F5C6D6'];

export const HAIR_LABEL: Record<HairStyle, string> = {
  short: 'Short',
  long: 'Long',
  bun: 'Bun',
  curly: 'Curly',
  buzz: 'Buzz',
  bald: 'Bald',
};

export const ACCESSORY_LABEL: Record<Accessory, string> = {
  none: 'None',
  glasses: 'Glasses',
  sunglasses: 'Shades',
  earrings: 'Earrings',
  hat: 'Hat',
};

export function randomAvatar(): AvatarConfig {
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
  return {
    skin: pick(SKIN_TONES),
    hair: pick(HAIR_STYLES),
    hairColor: pick(HAIR_COLORS),
    accessory: pick(ACCESSORIES),
    bg: pick(BG_COLORS),
  };
}
