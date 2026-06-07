// Design system — single source of truth. Never hardcode hex anywhere else.

export const colors = {
  forest: '#163324', // primary — buttons, nav, key UI
  amber: '#C87828', // accent — badges, CTA, highlights
  cream: '#F4EDE0', // background
  ink: '#0C1A0E', // primary text
  surface: '#FDFAF5', // cards and surfaces
  muted: '#8A7E6E', // secondary text
  border: '#DDD4C4', // dividers and borders
  white: '#FFFFFF',
  // Playful "buddy" accents (mascot/social layer) — bright + friendly.
  bubble: '#FF5BA8', // hot pink — mascot, social CTAs, likes
  bubbleDark: '#E03E8C',
  sprout: '#7FA03A', // olive green mascot
  sky: '#8FB0CE', // soft blue accent
} as const;

// Plant stem colors by health state (mirrors backend lib/health.ts).
export const healthColors = {
  flourishing: '#2A6E44',
  good: '#3A7A52',
  fading: '#8AB030',
  wilting: '#C89030',
  critical: '#C44A3A',
} as const;

// Fredoka (rounded geometric sans) is loaded at startup in app/_layout.tsx and
// gives the app its cute, Manima-like personality. Falls back to system fonts
// until loaded. The serif/mono keys are kept so older styles still resolve.
export const fonts = {
  display: 'Fredoka_600SemiBold', // big playful headers
  displayBold: 'Fredoka_700Bold',
  header: 'Fredoka_600SemiBold',
  headerItalic: 'Fredoka_600SemiBold',
  body: 'Fredoka_400Regular',
  bodyMedium: 'Fredoka_500Medium',
  mono: 'Fredoka_500Medium',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export type HealthState = keyof typeof healthColors;

export const HEALTH_LABEL: Record<HealthState, string> = {
  flourishing: 'Flourishing',
  good: 'Good',
  fading: 'Fading',
  wilting: 'Wilting',
  critical: 'Critical',
};
