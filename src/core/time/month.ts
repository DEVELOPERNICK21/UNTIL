/**
 * Month progress logic
 * Pure functions - no side effects
 */

import type { MonthProgress } from '../../types';
import { daysInMonth } from './clock';

/**
 * Calculate progress through the current month (0 = 1st, 1 = last day)
 */
export function getMonthProgress(date: Date): MonthProgress {
  const dayOfMonth = date.getDate();
  const totalDays = daysInMonth(date);
  const progress = (dayOfMonth - 1) / totalDays;
  const remainingDays = totalDays - dayOfMonth;

  return {
    progress: Math.min(1, Math.max(0, progress)),
    dayOfMonth,
    daysInMonth: totalDays,
    remainingDays: Math.max(0, remainingDays),
  };
}
