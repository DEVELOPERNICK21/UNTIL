/**
 * Project regret - given pattern, project wasted days to year and target age
 * Pure functions - no side effects
 */

import type { RegretProjection } from '../../types';
import { parseDate } from '../time/clock';

const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365.25;

/**
 * Project pattern (avg hours "nothing" per day) to year and target age
 */
export function projectRegret(
  avgNothingHoursPerDay: number,
  birthDateIso: string,
  deathAge: number,
  targetAge: number = 30
): RegretProjection {
  const daysWastedThisYear = (avgNothingHoursPerDay * DAYS_PER_YEAR) / HOURS_PER_DAY;
  const currentAge = getCurrentAge(birthDateIso);
  const yearsUntilTarget = Math.max(0, targetAge - currentAge);
  const daysWastedByAge = daysWastedThisYear * yearsUntilTarget;

  return {
    daysWastedThisYear: Math.round(daysWastedThisYear),
    daysWastedByAge: Math.round(daysWastedByAge),
    targetAge,
  };
}

function getCurrentAge(birthDateIso: string): number {
  const birth = parseDate(birthDateIso);
  const now = new Date();
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  return (now.getTime() - birth.getTime()) / msPerYear;
}
