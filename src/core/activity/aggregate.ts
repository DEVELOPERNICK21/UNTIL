/**
 * Aggregate time blocks into category totals
 * Pure functions - no side effects
 */

import type { TimeBlock, ActivityCategory } from '../../types';
import { nowMs, startOfDay } from '../time/clock';

const MS_PER_HOUR = 60 * 60 * 1000;

type Interval = { start: number; end: number };

function blockInterval(block: TimeBlock, nowMsVal: number): Interval | null {
  const end = block.endMs ?? nowMsVal;
  if (end <= block.startMs) return null;
  return { start: block.startMs, end };
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

function mergedDurationHours(intervals: Interval[]): number {
  return intervals.reduce(
    (sum, interval) => sum + (interval.end - interval.start) / MS_PER_HOUR,
    0
  );
}

function categoryIntervals(
  blocks: TimeBlock[],
  category: ActivityCategory,
  nowMsVal: number
): Interval[] {
  const raw = blocks
    .filter(block => block.category === category)
    .map(block => blockInterval(block, nowMsVal))
    .filter((interval): interval is Interval => interval != null);

  return mergeIntervals(raw);
}

/**
 * Compute duration of a block in hours (uses now for ongoing blocks)
 */
export function blockDurationHours(
  block: TimeBlock,
  nowMsVal: number = nowMs()
): number {
  const interval = blockInterval(block, nowMsVal);
  if (!interval) return 0;
  return (interval.end - interval.start) / MS_PER_HOUR;
}

/**
 * Hours elapsed since local midnight for a reference timestamp.
 */
export function hoursElapsedInDay(nowMsVal: number = nowMs()): number {
  const dayStart = startOfDay(new Date(nowMsVal)).getTime();
  return Math.max(0, Math.min(24, (nowMsVal - dayStart) / MS_PER_HOUR));
}

/**
 * Lost/wasted time cannot exceed hours already passed today.
 */
export function capNothingHoursForToday(
  nothingHours: number,
  nowMsVal: number = nowMs()
): number {
  return Math.min(Math.max(0, nothingHours), hoursElapsedInDay(nowMsVal), 24);
}

/**
 * Aggregate blocks into hours per category (overlapping blocks merge per category)
 */
export function aggregateCategoryTotals(
  blocks: TimeBlock[],
  nowMsVal: number = nowMs()
): Record<ActivityCategory, number> {
  const categories: ActivityCategory[] = [
    'work',
    'sleep',
    'social',
    'gym',
    'nothing',
  ];

  const totals = {} as Record<ActivityCategory, number>;
  for (const category of categories) {
    totals[category] = mergedDurationHours(
      categoryIntervals(blocks, category, nowMsVal)
    );
  }

  totals.nothing = capNothingHoursForToday(totals.nothing, nowMsVal);
  return totals;
}

/**
 * Compute total hours in a specific category from blocks
 */
export function computeHoursInCategory(
  blocks: TimeBlock[],
  category: ActivityCategory,
  nowMsVal: number = nowMs()
): number {
  const hours = mergedDurationHours(
    categoryIntervals(blocks, category, nowMsVal)
  );
  if (category === 'nothing') {
    return capNothingHoursForToday(hours, nowMsVal);
  }
  return hours;
}

/**
 * Remaining nothing-hours that can still be logged today.
 */
export function remainingNothingLoggableHours(
  blocks: TimeBlock[],
  nowMsVal: number = nowMs()
): number {
  const logged = computeHoursInCategory(blocks, 'nothing', nowMsVal);
  return Math.max(0, hoursElapsedInDay(nowMsVal) - logged);
}
