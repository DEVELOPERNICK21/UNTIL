/**
 * Life progress logic
 * Pure functions - no side effects
 */

import type { LifeProgress } from '../../types';
import { parseDate } from './clock';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const DEFAULT_DEATH_AGE = 80;

/**
 * Calculate life progress (0 = birth, 1 = death age)
 */
export function getLifeProgress(
  birthDateIso: string,
  deathAge: number = DEFAULT_DEATH_AGE,
  nowDate: Date = new Date()
): LifeProgress {
  const birth = parseDate(birthDateIso);
  const death = new Date(birth);
  death.setFullYear(birth.getFullYear() + deathAge);

  const totalMs = death.getTime() - birth.getTime();
  const elapsedMs = nowDate.getTime() - birth.getTime();
  const yearsLived = elapsedMs / MS_PER_YEAR;
  const yearsRemaining = Math.max(0, (death.getTime() - nowDate.getTime()) / MS_PER_YEAR);
  const totalYears = deathAge;

  let progress: number;
  if (elapsedMs <= 0) {
    progress = 0;
  } else if (elapsedMs >= totalMs) {
    progress = 1;
  } else {
    progress = elapsedMs / totalMs;
  }

  return {
    progress: Math.min(1, Math.max(0, progress)),
    yearsLived: Math.max(0, yearsLived),
    yearsRemaining,
    totalYears,
  };
}
