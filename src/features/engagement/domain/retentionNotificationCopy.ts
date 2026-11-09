import { t } from '../../../shared/i18n/translate';
import { MS_PER_DAY } from '../../../shared/time/constants';

export interface RetentionNotificationInput {
  date: Date;
  yearProgress: number;
  lifeWeeksLived?: number;
}

export interface RetentionNotificationCopy {
  title: string;
  body: string;
}

export interface RetentionScheduleInput {
  now: Date;
  enabled: boolean;
  yearProgress: number;
  lifeWeeksLived?: number;
  lastAppOpenDateKey?: string;
  lastAppOpenHour?: number;
  daysAhead?: number;
}

export interface RetentionScheduleItem extends RetentionNotificationCopy {
  id: string;
  dateKey: string;
  triggerAt: Date;
}

export interface RetentionSkipInput {
  triggerAt: Date;
  lastAppOpenDateKey?: string;
  lastAppOpenHour?: number;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value * 100)));
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function notificationTimeForDate(date: Date): Date | null {
  const day = date.getDay();
  if (day === 6) return null; // Saturday off.
  const hour = day === 0 ? 9 : 8;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    0,
    0,
    0
  );
}

export function buildRetentionNotification(
  input: RetentionNotificationInput
): RetentionNotificationCopy | null {
  const weekday = input.date.getDay();
  const yearPct = clampPercent(input.yearProgress);

  if (weekday === 6) return null;

  const weekdayKeys = [
    null,
    'notifications.retention.monday',
    'notifications.retention.tuesday',
    'notifications.retention.wednesday',
    'notifications.retention.thursday',
    'notifications.retention.friday',
  ] as const;
  const weekdayKey = weekdayKeys[weekday];
  if (weekdayKey) return { title: 'UNTIL', body: t(weekdayKey) };

  if (weekday === 0) {
    const weeks = input.lifeWeeksLived;
    return {
      title: 'UNTIL',
      body:
        typeof weeks === 'number' && weeks > 0
          ? t('notifications.retention.sundayWeeks', { count: weeks })
          : t('notifications.retention.sunday'),
    };
  }

  return {
    title: 'UNTIL',
    body: t('notifications.retention.yearFallback', { pct: yearPct }),
  };
}

/** From this many days away the daily line becomes a gentle "still here" instead of a routine one. */
export const WIN_BACK_AFTER_DAYS = 3;
/** Past this the reminders stop: a person who has not opened the app in two weeks is not helped by more. */
export const WIN_BACK_GIVE_UP_AFTER_DAYS = 14;

/** Whole local days from one YYYY-MM-DD key to another (never negative). */
export function daysBetweenDateKeys(fromKey: string, toKey: string): number {
  const parse = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, (m || 1) - 1, d || 1);
  };
  const diff = Math.round((parse(toKey) - parse(fromKey)) / MS_PER_DAY);
  return Number.isFinite(diff) ? Math.max(0, diff) : 0;
}

/** Copy for someone who has been away `daysAway` days. Calm, no guilt, one fact. */
export function buildWinBackNotification(
  daysAway: number,
  yearProgress: number
): RetentionNotificationCopy {
  const yearPct = clampPercent(yearProgress);
  if (daysAway >= 7) {
    return {
      title: 'UNTIL',
      body: t('notifications.retention.winBackWeek', { pct: yearPct }),
    };
  }
  return {
    title: 'UNTIL',
    body: t('notifications.retention.winBackDays', {
      count: daysAway,
      pct: yearPct,
    }),
  };
}

export function shouldSkipRetentionNotification(input: RetentionSkipInput): boolean {
  const triggerDay = getLocalDateKey(input.triggerAt);
  return (
    input.lastAppOpenDateKey === triggerDay &&
    typeof input.lastAppOpenHour === 'number' &&
    input.lastAppOpenHour >= 7
  );
}

export function buildRetentionNotificationSchedule(
  input: RetentionScheduleInput
): RetentionScheduleItem[] {
  if (!input.enabled) return [];

  const daysAhead = input.daysAhead ?? 7;
  const scheduledDays = new Set<string>();
  const items: RetentionScheduleItem[] = [];

  for (let offset = 0; offset < daysAhead; offset += 1) {
    const date = new Date(input.now.getTime() + offset * MS_PER_DAY);
    const triggerAt = notificationTimeForDate(date);
    if (!triggerAt || triggerAt <= input.now) continue;
    if (
      shouldSkipRetentionNotification({
        triggerAt,
        lastAppOpenDateKey: input.lastAppOpenDateKey,
        lastAppOpenHour: input.lastAppOpenHour,
      })
    ) {
      continue;
    }

    const dateKey = getLocalDateKey(triggerAt);
    if (scheduledDays.has(dateKey)) continue;

    const daysAway = input.lastAppOpenDateKey
      ? daysBetweenDateKeys(input.lastAppOpenDateKey, dateKey)
      : 0;
    if (daysAway > WIN_BACK_GIVE_UP_AFTER_DAYS) continue;

    const copy =
      daysAway >= WIN_BACK_AFTER_DAYS
        ? buildWinBackNotification(daysAway, input.yearProgress)
        : buildRetentionNotification({
            date: triggerAt,
            yearProgress: input.yearProgress,
            lifeWeeksLived: input.lifeWeeksLived,
          });
    if (!copy) continue;

    scheduledDays.add(dateKey);
    items.push({
      ...copy,
      id: `retention-${dateKey}`,
      dateKey,
      triggerAt,
    });
  }

  return items;
}
