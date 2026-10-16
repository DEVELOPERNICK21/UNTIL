/**
 * Local notifications for daily tasks and countdown deadlines.
 *
 * - 11 PM reminder when a day still has unfinished tasks.
 * - One instant notification when the last task of today is checked off.
 * - 8 AM and 11 PM notices on a countdown's final day.
 */

import { Platform } from 'react-native';
import { getLocalDateKey } from '../domain/retentionNotificationCopy';
import {
  buildTaskCompletionCopy,
  buildTaskDeadlineSchedule,
  getWindowDateKeys,
  type TaskDayCounts,
  type TaskDeadlineCountdown,
} from '../domain/taskDeadlineCopy';
import { getString, setString } from '../../../shared/persistence/mmkv';
import { STORAGE_KEYS } from '../../../shared/persistence/schema';
import {
  hasNotificationPermission,
  requestNotificationPermission,
} from '../../../shared/platform/notificationPermission';

const CHANNEL_ID = 'task_deadline';
const CHANNEL_NAME = 'Tasks and deadlines';
const DEFAULT_ENABLED = false;
const CHANGE_DEBOUNCE_MS = 400;

/** Data owned by other repositories. Injected by di.ts. */
export type TaskDeadlineSource = {
  getTaskCountsByDate: (dateKeys: string[]) => Record<string, TaskDayCounts>;
  getCountdowns: () => TaskDeadlineCountdown[];
};

let source: TaskDeadlineSource = {
  getTaskCountsByDate: () => ({}),
  getCountdowns: () => [],
};

let queue: Promise<void> = Promise.resolve();
let syncGeneration = 0;
let lastTodayPending: number | null = null;
let changeTimer: ReturnType<typeof setTimeout> | null = null;

export function configureTaskDeadlineNotifications(
  next: TaskDeadlineSource
): void {
  source = next;
}

function isSupportedPlatform(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

function parseIds(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function saveIds(ids: string[]): void {
  setString(STORAGE_KEYS.TASK_DEADLINE_NOTIFICATIONS_IDS, JSON.stringify(ids));
}

export function getTaskDeadlineNotificationsEnabled(): boolean {
  const raw = getString(STORAGE_KEYS.TASK_DEADLINE_NOTIFICATIONS_ENABLED);
  if (raw === '0') return false;
  if (raw === '1') return true;
  return DEFAULT_ENABLED;
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const notifee = require('@notifee/react-native').default;
  const { AndroidImportance } = require('@notifee/react-native');
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    importance: AndroidImportance.DEFAULT,
  });
}

async function cancelScheduled(): Promise<void> {
  const ids = parseIds(getString(STORAGE_KEYS.TASK_DEADLINE_NOTIFICATIONS_IDS));
  if (ids.length === 0) return;
  try {
    const notifee = require('@notifee/react-native').default;
    await Promise.all(ids.map(id => notifee.cancelNotification(id)));
  } catch {
    /* Notifee unavailable */
  } finally {
    saveIds([]);
  }
}

function readTodayCounts(now: Date): TaskDayCounts {
  const todayKey = getLocalDateKey(now);
  return (
    source.getTaskCountsByDate([todayKey])[todayKey] ?? { total: 0, pending: 0 }
  );
}

function isStaleSync(started: number): boolean {
  return started !== syncGeneration || !getTaskDeadlineNotificationsEnabled();
}

async function discardIfStale(
  started: number,
  ids: string[]
): Promise<boolean> {
  if (!isStaleSync(started)) return false;
  saveIds(ids);
  await cancelScheduled();
  return true;
}

async function runSync(now: Date): Promise<void> {
  if (!isSupportedPlatform()) return;
  const started = syncGeneration;
  if (!getTaskDeadlineNotificationsEnabled()) {
    await cancelScheduled();
    return;
  }
  if (!(await hasNotificationPermission())) {
    await cancelScheduled();
    return;
  }
  if (isStaleSync(started)) return;

  const schedule = buildTaskDeadlineSchedule({
    now,
    taskCountsByDate: source.getTaskCountsByDate(getWindowDateKeys(now)),
    countdowns: source.getCountdowns(),
  });

  try {
    const notifee = require('@notifee/react-native').default;
    const { TriggerType } = require('@notifee/react-native');
    await ensureChannel();
    if (isStaleSync(started)) return;
    await cancelScheduled();
    if (isStaleSync(started)) return;

    const ids: string[] = [];
    for (const item of schedule) {
      if (await discardIfStale(started, ids)) return;
      await notifee.createTriggerNotification(
        {
          id: item.id,
          title: item.title,
          body: item.body,
          data: { type: 'task_deadline', kind: item.kind },
          android: { channelId: CHANNEL_ID, pressAction: { id: 'default' } },
          ios: { sound: 'default' },
        },
        { type: TriggerType.TIMESTAMP, timestamp: item.triggerAt.getTime() }
      );
      ids.push(item.id);
    }
    if (await discardIfStale(started, ids)) return;
    saveIds(ids);
  } catch {
    /* Notifee unavailable or permission revoked */
  }
}

/** Rebuilds the schedule. Calls run one after another so batches never overlap. */
export function syncTaskDeadlineNotifications(
  now: Date = new Date()
): Promise<void> {
  queue = queue.then(() => runSync(now)).catch(() => {});
  return queue;
}

/** App open or foreground: reset the completion baseline, then sync. */
export async function refreshTaskDeadlineNotifications(
  now: Date = new Date()
): Promise<void> {
  lastTodayPending = readTodayCounts(now).pending;
  await syncTaskDeadlineNotifications(now);
}

async function showCompletionNotification(
  now: Date,
  total: number
): Promise<void> {
  const todayKey = getLocalDateKey(now);
  if (getString(STORAGE_KEYS.TASK_DEADLINE_COMPLETION_NOTIFIED_DATE) === todayKey) {
    return;
  }
  if (!isSupportedPlatform() || !getTaskDeadlineNotificationsEnabled()) return;
  if (!(await hasNotificationPermission())) return;

  try {
    const notifee = require('@notifee/react-native').default;
    await ensureChannel();
    const copy = buildTaskCompletionCopy(total);
    await notifee.displayNotification({
      id: `taskdl-done-${todayKey}`,
      title: copy.title,
      body: copy.body,
      data: { type: 'task_deadline', kind: 'tasks_completed' },
      android: { channelId: CHANNEL_ID, pressAction: { id: 'default' } },
      ios: { sound: 'default' },
    });
    setString(STORAGE_KEYS.TASK_DEADLINE_COMPLETION_NOTIFIED_DATE, todayKey);
  } catch {
    /* Notifee unavailable */
  }
}

/** Tasks or countdowns changed: resync, and celebrate if today just got fully done. */
export async function handleTaskDeadlineDataChanged(
  now: Date = new Date()
): Promise<void> {
  const today = readTodayCounts(now);
  const previousPending = lastTodayPending;
  lastTodayPending = today.pending;

  await syncTaskDeadlineNotifications(now);

  const justFinished =
    previousPending != null &&
    previousPending > 0 &&
    today.pending === 0 &&
    today.total > 0;
  if (justFinished) {
    await showCompletionNotification(now, today.total);
  }
}

/** Debounced entry point for repository subscriptions. */
export function queueTaskDeadlineSync(): void {
  if (changeTimer) clearTimeout(changeTimer);
  changeTimer = setTimeout(() => {
    changeTimer = null;
    handleTaskDeadlineDataChanged().catch(() => {});
  }, CHANGE_DEBOUNCE_MS);
}

export async function setTaskDeadlineNotificationsEnabled(
  enabled: boolean
): Promise<void> {
  setString(
    STORAGE_KEYS.TASK_DEADLINE_NOTIFICATIONS_ENABLED,
    enabled ? '1' : '0'
  );
  if (enabled) {
    await requestNotificationPermission('settings_task_deadline', {
      allowIos: true,
    });
    await refreshTaskDeadlineNotifications();
  } else {
    syncGeneration += 1;
    await cancelScheduled();
    await queue;
    await cancelScheduled();
  }
}
