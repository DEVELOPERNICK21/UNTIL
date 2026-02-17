/**
 * Aggregate time blocks into category totals
 * Pure functions - no side effects
 */

import type { TimeBlock, ActivityCategory } from '../../types';
import { nowMs } from '../time/clock';

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Compute duration of a block in hours (uses now for ongoing blocks)
 */
export function blockDurationHours(block: TimeBlock, nowMsVal: number = nowMs()): number {
  const end = block.endMs ?? nowMsVal;
  const durationMs = Math.max(0, end - block.startMs);
  return durationMs / MS_PER_HOUR;
}

/**
 * Aggregate blocks into hours per category
 */
export function aggregateCategoryTotals(
  blocks: TimeBlock[],
  nowMsVal: number = nowMs()
): Record<ActivityCategory, number> {
  const totals: Record<string, number> = {
    work: 0,
    sleep: 0,
    social: 0,
    gym: 0,
    nothing: 0,
  };

  for (const block of blocks) {
    const hours = blockDurationHours(block, nowMsVal);
    if (totals[block.category] !== undefined) {
      totals[block.category] += hours;
    }
  }

  return totals as Record<ActivityCategory, number>;
}

/**
 * Compute total hours in a specific category from blocks
 */
export function computeHoursInCategory(
  blocks: TimeBlock[],
  category: ActivityCategory,
  nowMsVal: number = nowMs()
): number {
  return blocks
    .filter((b) => b.category === category)
    .reduce((sum, b) => sum + blockDurationHours(b, nowMsVal), 0);
}
