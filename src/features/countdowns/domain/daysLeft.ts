import { MS_PER_DAY } from '../../../shared/time/constants';
import { now as clockNow } from '../../../shared/time/clock';
/**
 * Days until a date (YYYY-MM-DD), by calendar day in the device's own timezone.
 *
 * Days are counted by comparing calendar dates (as UTC midnights), never by dividing a difference of
 * local midnights by 24 hours: on the day the clocks change a local day is 23 or 25 hours long, which
 * made a deadline show a day too many in autumn and a day too few in spring.
 */

export interface DateKey {
  y: number;
  m: number;
  d: number;
}

/** Reads a YYYY-MM-DD string. Null when it is not a real calendar date (2026-02-30, 2026-13-01, junk). */
export function parseDateKey(dateStr: unknown): DateKey | null {
  if (typeof dateStr !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(y, m - 1, d));
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== m - 1 ||
    check.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

export function isValidDateKey(dateStr: unknown): dateStr is string {
  return parseDateKey(dateStr) !== null;
}

/** Whole days since 1970-01-01 for a calendar date; exact, because it ignores the time of day and DST. */
function dayNumber({ y, m, d }: DateKey): number {
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

function todayKey(today: Date): DateKey {
  return { y: today.getFullYear(), m: today.getMonth() + 1, d: today.getDate() };
}

/**
 * Signed day offset: positive = future, zero = today, negative = past.
 * A date that is not a real calendar date counts as today (0) rather than leaking NaN to the screen.
 */
export function getSignedDaysUntil(dateStr: string, today: Date = clockNow()): number {
  const target = parseDateKey(dateStr);
  if (!target) return 0;
  return dayNumber(target) - dayNumber(todayKey(today));
}

export function getDaysLeft(dateStr: string, today: Date = clockNow()): number {
  return Math.max(0, getSignedDaysUntil(dateStr, today));
}

export function daysBetween(startDateStr: string, endDateStr: string): number {
  const start = parseDateKey(startDateStr);
  const end = parseDateKey(endDateStr);
  if (!start || !end) return 0;
  return Math.max(0, dayNumber(end) - dayNumber(start));
}

export function formatDaysLeft(daysLeft: number): string {
  if (daysLeft === 0) return 'Today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}

export function formatSignedDaysUntil(days: number): string {
  if (days > 1) return `${days} days left`;
  if (days === 1) return '1 day left';
  if (days === 0) return 'Today';
  if (days === -1) return '1 day ago';
  return `${Math.abs(days)} days ago`;
}
