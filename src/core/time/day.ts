/**
 * Day progress logic
 * Pure functions - no side effects
 */

import type { DayProgress } from '../../types';
import {
  now,
  startOfDay,
  endOfDay,
} from './clock';

/**
 * Calculate progress through the current day (0 = midnight, 1 = end of day)
 */
export function getDayProgress(date: Date = now()): DayProgress {
  const start = startOfDay(date);
  const end = endOfDay(date);
  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = date.getTime() - start.getTime();
  const remainingMs = Math.max(0, end.getTime() - date.getTime());

  return {
    progress: Math.min(1, Math.max(0, elapsedMs / totalMs)),
    remainingMs,
    totalMs,
    startOfDay: start.getTime(),
    endOfDay: end.getTime(),
  };
}
