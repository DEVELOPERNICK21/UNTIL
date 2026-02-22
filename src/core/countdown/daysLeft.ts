/**
 * Compute days left until a date (YYYY-MM-DD). Uses local date only.
 * Returns 0 if the date is today or in the past.
 */

export function getDaysLeft(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, (m ?? 1) - 1, d ?? 1);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, days);
}

export function formatDaysLeft(daysLeft: number): string {
  if (daysLeft === 0) return 'Today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}
