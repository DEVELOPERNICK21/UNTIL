/**
 * Compute days left until a date (YYYY-MM-DD). Uses local date only.
 * Returns 0 if the date is today or in the past.
 */

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, (m ?? 1) - 1, d ?? 1);
  target.setHours(0, 0, 0, 0);
  return target;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** Signed day offset: positive = future, zero = today, negative = past. */
export function getSignedDaysUntil(dateStr: string): number {
  const target = parseLocalDate(dateStr);
  const today = startOfToday();
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export function getDaysLeft(dateStr: string): number {
  return Math.max(0, getSignedDaysUntil(dateStr));
}

export function daysBetween(startDateStr: string, endDateStr: string): number {
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
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
