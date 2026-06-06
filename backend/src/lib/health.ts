// Plant health is ALWAYS computed on the server (per CLAUDE.md).
// Source of truth for the 5 states and their stem colors.

export type HealthState =
  | 'flourishing'
  | 'good'
  | 'fading'
  | 'wilting'
  | 'critical';

interface HealthInfo {
  state: HealthState;
  stemColor: string;
}

const STEM_COLORS: Record<HealthState, string> = {
  flourishing: '#2A6E44',
  good: '#3A7A52',
  fading: '#8AB030',
  wilting: '#C89030',
  critical: '#C44A3A',
};

/** days = days since last contact. null/never-contacted is treated as critical. */
export function healthFromDays(days: number | null): HealthInfo {
  let state: HealthState;
  if (days === null) state = 'critical';
  else if (days <= 7) state = 'flourishing';
  else if (days <= 20) state = 'good';
  else if (days <= 35) state = 'fading';
  else if (days <= 55) state = 'wilting';
  else state = 'critical';

  return { state, stemColor: STEM_COLORS[state] };
}

/** Whole days between last contact and now. null if never contacted. */
export function daysSince(lastContactAt: Date | string | null): number | null {
  if (!lastContactAt) return null;
  const then = new Date(lastContactAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / 86_400_000));
}
