const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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

function formatNumber(n: number): string {
  return n.toLocaleString('en-IN');
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

  if (weekday === 1) {
    return {
      title: 'UNTIL',
      body: 'Your week starts now. Monday is 0% gone. What will you do with it?',
    };
  }

  if (weekday === 2) {
    return {
      title: 'UNTIL',
      body: '29% of this week is behind you. Tuesday morning. The week is moving fast.',
    };
  }

  if (weekday === 3) {
    return {
      title: 'UNTIL',
      body: 'Halfway through the week. Wednesday. You still have 57% of this week left.',
    };
  }

  if (weekday === 4) {
    return {
      title: 'UNTIL',
      body: '71% of this week is gone. Only Friday left before the weekend.',
    };
  }

  if (weekday === 5) {
    return {
      title: 'UNTIL',
      body: 'Last working day of the week. What did you say you would finish this week?',
    };
  }

  if (weekday === 0) {
    const lifeLine =
      typeof input.lifeWeeksLived === 'number' && input.lifeWeeksLived > 0
        ? ` You have lived ${formatNumber(input.lifeWeeksLived)} weeks.`
        : '';
    return {
      title: 'UNTIL',
      body: `Another week of your life begins tomorrow.${lifeLine} Open UNTIL and see where you stand.`,
    };
  }

  return {
    title: 'UNTIL',
    body: `Your year is ${yearPct}% gone. Open UNTIL and see where you stand.`,
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
    const date = new Date(input.now.getTime() + offset * ONE_DAY_MS);
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

    const copy = buildRetentionNotification({
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
