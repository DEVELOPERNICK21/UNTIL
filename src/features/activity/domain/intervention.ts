/**
 * Intervention logic - determine if user crossed daily limit
 * Pure functions - no side effects
 */

export interface InterventionResult {
  shouldShowRed: boolean;
  limitCrossed: boolean;
  message: string | null;
}

/**
 * Check if today's "nothing" hours exceed the daily limit
 */
export function shouldIntervene(
  nothingHoursToday: number,
  dailyLimitHours: number,
): InterventionResult {
  const limitCrossed = nothingHoursToday >= dailyLimitHours;
  return {
    shouldShowRed: limitCrossed,
    limitCrossed,
    message: limitCrossed ? 'This day will never repeat.' : null,
  };
}
