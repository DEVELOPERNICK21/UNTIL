/**
 * Time source, timezone, and DST-safe helpers
 * Pure functions - no side effects, no React, no Native
 */

/**
 * Get current time as Date (uses device timezone)
 */
export function now(): Date {
  return new Date();
}

/**
 * Get current timestamp (milliseconds since epoch)
 */
export function nowMs(): number {
  return Date.now();
}

/**
 * Start of day (midnight) for a given date in local timezone
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * End of day (23:59:59.999) for a given date in local timezone
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Start of month (first day, midnight)
 */
export function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * End of month (last day, 23:59:59.999)
 */
export function endOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Start of year (Jan 1, midnight)
 */
export function startOfYear(date: Date): Date {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * End of year (Dec 31, 23:59:59.999)
 */
export function endOfYear(date: Date): Date {
  const d = new Date(date);
  d.setMonth(11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Days in month for a given date (DST-safe)
 */
export function daysInMonth(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return d.getDate();
}

/**
 * Days in year (365 or 366 for leap years)
 */
export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Parse ISO date string (YYYY-MM-DD) to Date at midnight local
 */
export function parseDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format Date to ISO date string (YYYY-MM-DD)
 */
export function formatDateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
