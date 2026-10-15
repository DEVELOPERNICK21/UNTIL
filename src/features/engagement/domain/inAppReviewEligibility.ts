export const AUTO_REVIEW_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;
export const MIN_APP_OPENS_FOR_REVIEW = 5;
export const MIN_DAYS_SINCE_FIRST_OPEN = 3;

function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function daysBetweenDateKeys(startKey: string, endKey: string): number {
  const start = parseLocalDateKey(startKey);
  const end = parseLocalDateKey(endKey);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));
}

export function isAutoReviewCooldownElapsed(
  lastAutoReviewRequestAtMs: number | null,
  nowMs: number
): boolean {
  if (lastAutoReviewRequestAtMs == null) return true;
  return nowMs - lastAutoReviewRequestAtMs >= AUTO_REVIEW_COOLDOWN_MS;
}

export function isSustainedUseEligible(
  appOpenCount: number,
  firstOpenDateKey: string | null,
  todayDateKey: string
): boolean {
  if (appOpenCount < MIN_APP_OPENS_FOR_REVIEW) return false;
  if (!firstOpenDateKey) return false;
  return (
    daysBetweenDateKeys(firstOpenDateKey, todayDateKey) >=
    MIN_DAYS_SINCE_FIRST_OPEN
  );
}
