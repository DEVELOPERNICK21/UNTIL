import { MS_PER_DAY } from '../../../shared/time/constants';
import { now as clockNow } from '../../../shared/time/clock';
import { t } from '../../../shared/i18n/translate';

/**
 * Days until a date (YYYY-MM-DD), by calendar day in the device's own timezone, and the labels for them.
 *
 * Days are counted by comparing calendar dates (as UTC midnights), never by dividing a difference of
 * local midnights by 24 hours: on the day the clocks change a local day is 23 or 25 hours long, which
 * made a deadline show a day too many in autumn and a day too few in spring.
 * Label formatters take the hook's `t` from a component so memoised callers recompute
 * when the language changes.
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

/** A stored `YYYY-MM-DD` as local midnight, ready to show with the language's date format. */
export function parseLocalDate(dateStr: string): Date {
  const key = parseDateKey(dateStr) ?? todayKey(clockNow());
  return new Date(key.y, key.m - 1, key.d);
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

export function formatDaysLeft(
  daysLeft: number,
  translate: typeof t = t,
): string {
  if (daysLeft === 0) return translate('common.today');
  return translate('countdowns.daysLeft', { count: daysLeft });
}

export function formatSignedDaysUntil(
  days: number,
  translate: typeof t = t,
): string {
  if (days > 0) return translate('countdowns.daysLeft', { count: days });
  if (days === 0) return translate('common.today');
  return translate('countdowns.daysAgo', { count: Math.abs(days) });
}
