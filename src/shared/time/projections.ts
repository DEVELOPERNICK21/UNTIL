/**
 * Future estimations and projections
 * Pure functions - no side effects
 */

import { parseDate, now as clockNow } from './clock';
import { MS_PER_YEAR } from './constants';

/**
 * Estimate timestamp when a given life progress (0-1) will be reached
 */
export function projectLifeProgressTimestamp(
  birthDateIso: string,
  targetProgress: number,
  deathAge: number = 80
): number {
  const birth = parseDate(birthDateIso);
  const totalMs = deathAge * MS_PER_YEAR;
  const targetMs = birth.getTime() + targetProgress * totalMs;
  return targetMs;
}

/**
 * Get milliseconds until next midnight (start of tomorrow)
 */
export function msUntilNextMidnight(date: Date = clockNow()): number {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - date.getTime();
}
