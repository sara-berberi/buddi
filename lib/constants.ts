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
} as const;

// Plant stem colors by health state (mirrors backend lib/health.ts).
export const healthColors = {
  flourishing: '#2A6E44',
  good: '#3A7A52',
  fading: '#8AB030',
  wilting: '#C89030',
  critical: '#C44A3A',
} as const;

export const fonts = {
  // Headers → Fraunces italic (serif); Body → Instrument Sans; Numbers → DM Mono.
  header: 'Fraunces',
  headerItalic: 'Fraunces-Italic',
  body: 'InstrumentSans',
  bodyMedium: 'InstrumentSans-Medium',
  mono: 'DMMono',
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
