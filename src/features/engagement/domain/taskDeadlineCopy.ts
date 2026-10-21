import { getLocalDateKey } from './retentionNotificationCopy';

export const TASK_REMINDER_HOUR = 23;
export const DEADLINE_MORNING_HOUR = 8;
export const SCHEDULE_DAYS_AHEAD = 7;

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface TaskDayCounts {
  total: number;
  pending: number;
}

export interface TaskDeadlineCountdown {
  id: string;
  title: string;
  date: string;
}

export type TaskDeadlineKind =
  | 'tasks_pending'
  | 'deadline_morning'
  | 'deadline_last_hour';

export interface TaskDeadlineScheduleItem {
  id: string;
  kind: TaskDeadlineKind;
  dateKey: string;
  title: string;
  body: string;
  triggerAt: Date;
}

export interface TaskDeadlineScheduleInput {
  now: Date;
  daysAhead?: number;
  taskCountsByDate: Record<string, TaskDayCounts>;
  countdowns: TaskDeadlineCountdown[];
}

function localTime(dateKey: string, hour: number): Date | null {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) return null;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    hour,
    0,
    0,
    0
  );
}

export function getWindowDateKeys(
  now: Date,
  daysAhead: number = SCHEDULE_DAYS_AHEAD
): string[] {
  const keys: string[] = [];
  for (let offset = 0; offset < daysAhead; offset += 1) {
    keys.push(
      getLocalDateKey(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
      )
    );
  }
  return keys;
}

function buildPendingTasksCopy(pending: number): {
  title: string;
  body: string;
} {
  return {
    title: '1 hour left today',
    body:
      pending === 1 ? '1 task still open.' : `${pending} tasks still open.`,
  };
}

export function buildTaskCompletionCopy(total: number): {
  title: string;
  body: string;
} {
  return {
    title: 'All done',
    body:
      total === 1
        ? '1 of 1 task finished today.'
        : `${total} of ${total} tasks finished today.`,
  };
}

export function buildTaskDeadlineSchedule(
  input: TaskDeadlineScheduleInput
): TaskDeadlineScheduleItem[] {
  const keys = getWindowDateKeys(input.now, input.daysAhead);
  const windowKeys = new Set(keys);
  const items: TaskDeadlineScheduleItem[] = [];

  for (const dateKey of keys) {
    const counts = input.taskCountsByDate[dateKey];
    if (!counts || counts.pending <= 0) continue;
    const triggerAt = localTime(dateKey, TASK_REMINDER_HOUR);
    if (!triggerAt || triggerAt <= input.now) continue;
    items.push({
      id: `taskdl-tasks-${dateKey}`,
      kind: 'tasks_pending',
      dateKey,
      triggerAt,
      ...buildPendingTasksCopy(counts.pending),
    });
  }

  for (const countdown of input.countdowns) {
    const dateKey = countdown.date.slice(0, 10);
    if (!windowKeys.has(dateKey)) continue;
    const name = countdown.title.trim() || 'Deadline';

    const morning = localTime(dateKey, DEADLINE_MORNING_HOUR);
    if (morning && morning > input.now) {
      items.push({
        id: `taskdl-dl-am-${countdown.id}-${dateKey}`,
        kind: 'deadline_morning',
        dateKey,
        triggerAt: morning,
        title: 'Due today',
        body: `${name} is due today.`,
      });
    }

    const evening = localTime(dateKey, TASK_REMINDER_HOUR);
    if (evening && evening > input.now) {
      items.push({
        id: `taskdl-dl-pm-${countdown.id}-${dateKey}`,
        kind: 'deadline_last_hour',
        dateKey,
        triggerAt: evening,
        title: '1 hour left',
        body: `${name} is due tonight.`,
      });
    }
  }

  return items.sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime());
}
