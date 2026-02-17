/**
 * Year progress logic
 * Pure functions - no side effects
 */

import type { YearProgress } from '../../types';
import { daysInYear } from './clock';

/**
 * Get day of year (1-365 or 1-366)
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 86400000;
  return Math.floor(diff / oneDay);
}

/**
 * Calculate progress through the current year (0 = Jan 1, 1 = Dec 31)
 */
export function getYearProgress(date: Date): YearProgress {
  const dayOfYear = getDayOfYear(date);
  const totalDays = daysInYear(date.getFullYear());
  const progress = dayOfYear / totalDays;
  const remainingDays = totalDays - dayOfYear;

  return {
    progress: Math.min(1, Math.max(0, progress)),
    dayOfYear,
    daysInYear: totalDays,
    remainingDays: Math.max(0, remainingDays),
  };
}
