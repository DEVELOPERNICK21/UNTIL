# Task and Deadline Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send local notifications for pending daily tasks at 11 PM, for all tasks completed, and for countdown deadlines on their final day.

**Architecture:** A pure builder in `domain/notifications` turns task counts and countdowns into a schedule. A service in `services/` cancels the old batch and schedules the new one with Notifee. `di.ts` injects data sources and subscribes to the task and countdown repositories. `app.tsx` resyncs on open and foreground. A Settings toggle controls it.

**Tech Stack:** React Native, TypeScript, `@notifee/react-native`, MMKV (`persistence/mmkv`), Jest.

Spec: `docs/superpowers/specs/2026-10-01-task-deadline-notifications-design.md`

Commit steps are left out on purpose. Commit only when the user asks.

## Global Constraints

- Last-hour reminder time: 11:00 PM local. Deadline morning notice: 8:00 AM local.
- Schedule window: today plus the next 6 days (7 days total).
- Zero tasks today sends nothing.
- Completion notification: immediate, at most once per local day, only on the transition from pending to all done.
- User-facing strings: no em dashes, no filler words (`.cursor/rules/human-copy.mdc`).
- Layers (`.cursor/rules/architecture.mdc`): services must not import `di`. Domain code must not import React, RN, or storage. Every `STORAGE_KEYS` entry is used by exactly one module.
- Platforms: Android and iOS. Notifee is loaded with `require` inside `try/catch`, like `retentionNotifications.ts`.
- Notification permission is never requested by sync. Only turning the toggle on requests it.

## File Structure

| File | Responsibility |
|---|---|
| `src/domain/notifications/taskDeadlineCopy.ts` (create) | Pure schedule builder and copy |
| `__tests__/taskDeadlineCopy.test.ts` (create) | Tests for the builder |
| `src/persistence/schema.ts` (modify) | Three new storage keys |
| `src/services/notificationPermission.ts` (modify) | `hasNotificationPermission`, optional iOS request |
| `src/services/taskDeadlineNotifications.ts` (create) | Scheduling, completion, enabled setting |
| `__tests__/taskDeadlineNotifications.test.ts` (create) | Service tests with mocked Notifee and MMKV |
| `src/di.ts` (modify) | Inject sources, subscribe to repositories |
| `src/app.tsx` (modify) | Resync on app open and foreground |
| `src/hooks/useTaskDeadlineNotifications.ts` (create), `src/hooks/index.ts` (modify) | Toggle hook |
| `src/surfaces/app/SettingsScreen.tsx` (modify) | Toggle row |
| `docs/superpowers/specs/2026-10-01-task-deadline-notifications-design.md` (modify) | Record two design adjustments |

---

### Task 1: Pure schedule builder

**Files:**
- Create: `src/domain/notifications/taskDeadlineCopy.ts`
- Test: `__tests__/taskDeadlineCopy.test.ts`

**Interfaces:**
- Consumes: `getLocalDateKey(date: Date): string` from `src/domain/notifications/retentionNotificationCopy.ts`
- Produces (used by Task 3):
  - `TaskDayCounts { total: number; pending: number }`
  - `TaskDeadlineCountdown { id: string; title: string; date: string }`
  - `TaskDeadlineScheduleItem { id: string; kind: 'tasks_pending' | 'deadline_morning' | 'deadline_last_hour'; dateKey: string; title: string; body: string; triggerAt: Date }`
  - `getWindowDateKeys(now: Date, daysAhead?: number): string[]`
  - `buildTaskDeadlineSchedule(input: { now: Date; daysAhead?: number; taskCountsByDate: Record<string, TaskDayCounts>; countdowns: TaskDeadlineCountdown[] }): TaskDeadlineScheduleItem[]`
  - `buildTaskCompletionCopy(total: number): { title: string; body: string }`

- [ ] **Step 1: Write the failing test**

Create `__tests__/taskDeadlineCopy.test.ts`:

```ts
import {
  buildTaskCompletionCopy,
  buildTaskDeadlineSchedule,
  getWindowDateKeys,
} from '../src/domain/notifications/taskDeadlineCopy';

const NOW = new Date(2026, 9, 1, 14, 0, 0); // Thu 1 Oct 2026, 2 PM

describe('getWindowDateKeys', () => {
  it('returns 7 local date keys starting today', () => {
    expect(getWindowDateKeys(NOW)).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
    ]);
  });
});

describe('buildTaskDeadlineSchedule: tasks', () => {
  it('schedules one 11 PM reminder for a day with pending tasks', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: { '2026-10-01': { total: 5, pending: 3 } },
      countdowns: [],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'taskdl-tasks-2026-10-01',
      kind: 'tasks_pending',
      dateKey: '2026-10-01',
      title: '1 hour left today',
      body: '3 tasks still open.',
    });
    expect(items[0].triggerAt.getTime()).toBe(
      new Date(2026, 9, 1, 23, 0, 0).getTime()
    );
  });

  it('uses singular copy for one pending task', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: { '2026-10-01': { total: 1, pending: 1 } },
      countdowns: [],
    });
    expect(items[0].body).toBe('1 task still open.');
  });

  it('sends nothing when all tasks are done or there are none', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: {
        '2026-10-01': { total: 4, pending: 0 },
        '2026-10-02': { total: 0, pending: 0 },
      },
      countdowns: [],
    });
    expect(items).toEqual([]);
  });

  it('skips today after 11 PM but still schedules tomorrow', () => {
    const items = buildTaskDeadlineSchedule({
      now: new Date(2026, 9, 1, 23, 30, 0),
      taskCountsByDate: {
        '2026-10-01': { total: 2, pending: 2 },
        '2026-10-02': { total: 2, pending: 2 },
      },
      countdowns: [],
    });
    expect(items.map(i => i.id)).toEqual(['taskdl-tasks-2026-10-02']);
  });

  it('ignores days outside the 7 day window', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: { '2026-10-20': { total: 2, pending: 2 } },
      countdowns: [],
    });
    expect(items).toEqual([]);
  });
});

describe('buildTaskDeadlineSchedule: countdowns', () => {
  const countdown = { id: 'c1', title: 'Launch', date: '2026-10-01' };

  it('schedules only the 11 PM notice when 8 AM has already passed', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: {},
      countdowns: [countdown],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'taskdl-dl-pm-c1-2026-10-01',
      kind: 'deadline_last_hour',
      title: '1 hour left',
      body: 'Launch is due tonight.',
    });
  });

  it('schedules the 8 AM and 11 PM notices before 8 AM', () => {
    const items = buildTaskDeadlineSchedule({
      now: new Date(2026, 9, 1, 6, 0, 0),
      taskCountsByDate: {},
      countdowns: [countdown],
    });

    expect(items.map(i => i.kind)).toEqual([
      'deadline_morning',
      'deadline_last_hour',
    ]);
    expect(items[0]).toMatchObject({
      id: 'taskdl-dl-am-c1-2026-10-01',
      title: 'Due today',
      body: 'Launch is due today.',
    });
    expect(items[0].triggerAt.getHours()).toBe(8);
    expect(items[1].triggerAt.getHours()).toBe(23);
  });

  it('schedules a countdown due tomorrow', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: {},
      countdowns: [{ ...countdown, date: '2026-10-02' }],
    });
    expect(items.map(i => i.id)).toEqual([
      'taskdl-dl-am-c1-2026-10-02',
      'taskdl-dl-pm-c1-2026-10-02',
    ]);
  });

  it('ignores past, far future, and malformed countdown dates', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: {},
      countdowns: [
        { id: 'a', title: 'Past', date: '2026-09-30' },
        { id: 'b', title: 'Far', date: '2026-12-25' },
        { id: 'c', title: 'Bad', date: 'next friday' },
      ],
    });
    expect(items).toEqual([]);
  });

  it('gives two countdowns on the same day distinct ids', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: {},
      countdowns: [
        { id: 'a', title: 'One', date: '2026-10-01' },
        { id: 'b', title: 'Two', date: '2026-10-01' },
      ],
    });
    const ids = items.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('falls back to "Deadline" for an empty title', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: {},
      countdowns: [{ id: 'a', title: '  ', date: '2026-10-01' }],
    });
    expect(items[0].body).toBe('Deadline is due tonight.');
  });

  it('returns items sorted by trigger time', () => {
    const items = buildTaskDeadlineSchedule({
      now: new Date(2026, 9, 1, 6, 0, 0),
      taskCountsByDate: { '2026-10-01': { total: 2, pending: 2 } },
      countdowns: [countdown],
    });
    const times = items.map(i => i.triggerAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe('buildTaskCompletionCopy', () => {
  it('uses singular for one task', () => {
    expect(buildTaskCompletionCopy(1)).toEqual({
      title: 'All done',
      body: '1 of 1 task finished today.',
    });
  });

  it('uses plural for many tasks', () => {
    expect(buildTaskCompletionCopy(5)).toEqual({
      title: 'All done',
      body: '5 of 5 tasks finished today.',
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/taskDeadlineCopy.test.ts`
Expected: FAIL with "Cannot find module '../src/domain/notifications/taskDeadlineCopy'".

- [ ] **Step 3: Write the implementation**

Create `src/domain/notifications/taskDeadlineCopy.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/taskDeadlineCopy.test.ts`
Expected: PASS, all tests green.

---

### Task 2: Storage keys, permission helper, and service

**Files:**
- Modify: `src/persistence/schema.ts` (after the `RETENTION_NOTIFICATIONS_PERMISSION_REQUESTED` entry, around line 109)
- Modify: `src/services/notificationPermission.ts`
- Create: `src/services/taskDeadlineNotifications.ts`
- Test: `__tests__/taskDeadlineNotifications.test.ts`

**Interfaces:**
- Consumes (Task 1): `buildTaskDeadlineSchedule`, `buildTaskCompletionCopy`, `getWindowDateKeys`, `TaskDayCounts`, `TaskDeadlineCountdown`. Also `getLocalDateKey` from `retentionNotificationCopy`.
- Produces (used by Tasks 3, 4, 5):
  - `type TaskDeadlineSource = { getTaskCountsByDate: (dateKeys: string[]) => Record<string, TaskDayCounts>; getCountdowns: () => TaskDeadlineCountdown[] }`
  - `configureTaskDeadlineNotifications(source: TaskDeadlineSource): void`
  - `getTaskDeadlineNotificationsEnabled(): boolean` (default `true`)
  - `setTaskDeadlineNotificationsEnabled(enabled: boolean): Promise<void>`
  - `syncTaskDeadlineNotifications(now?: Date): Promise<void>`
  - `refreshTaskDeadlineNotifications(now?: Date): Promise<void>` (app open and foreground; resets the completion baseline)
  - `handleTaskDeadlineDataChanged(now?: Date): Promise<void>` (data change; may show the completion notification)
  - `queueTaskDeadlineSync(): void` (debounced `handleTaskDeadlineDataChanged`)
  - `hasNotificationPermission(): Promise<boolean>` in `notificationPermission.ts`

- [ ] **Step 1: Add the storage keys**

In `src/persistence/schema.ts`, after the `RETENTION_NOTIFICATIONS_PERMISSION_REQUESTED` entry:

```ts
  // Task and deadline notifications. Owner: services/taskDeadlineNotifications.
  TASK_DEADLINE_NOTIFICATIONS_ENABLED: 'taskDeadline.notifications.enabled',
  TASK_DEADLINE_NOTIFICATIONS_IDS: 'taskDeadline.notifications.ids',
  TASK_DEADLINE_COMPLETION_NOTIFIED_DATE:
    'taskDeadline.notifications.completionNotifiedDate',
```

- [ ] **Step 2: Extend the permission wrapper**

Replace the contents of `src/services/notificationPermission.ts` with:

```ts
/**
 * Wraps Notifee permission requests with analytics.
 */

import { Platform } from 'react-native';
import { logAnalyticsEvent } from './analytics';

function isGranted(settings: { authorizationStatus: number }): boolean {
  return settings.authorizationStatus === 1 || settings.authorizationStatus === 2;
}

export async function requestNotificationPermission(
  source: string,
  options: { allowIos?: boolean } = {}
): Promise<boolean> {
  const supported =
    Platform.OS === 'android' || (options.allowIos && Platform.OS === 'ios');
  if (!supported) {
    return false;
  }

  try {
    const notifee = require('@notifee/react-native').default;
    const settings = await notifee.requestPermission();
    const granted = isGranted(settings);
    void logAnalyticsEvent('notification_permission_result', {
      granted,
      source,
    });
    return granted;
  } catch {
    void logAnalyticsEvent('notification_permission_result', {
      granted: false,
      source,
    });
    return false;
  }
}

/** Reads the current permission without prompting. */
export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;
  try {
    const notifee = require('@notifee/react-native').default;
    return isGranted(await notifee.getNotificationSettings());
  } catch {
    return false;
  }
}
```

- [ ] **Step 3: Write the failing service test**

Create `__tests__/taskDeadlineNotifications.test.ts`:

```ts
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

jest.mock('../src/persistence/mmkv', () => {
  const store = new Map<string, string>();
  return {
    getString: (key: string) => store.get(key),
    setString: (key: string, value: string) => {
      store.set(key, value);
    },
  };
});

jest.mock('../src/services/notificationPermission', () => ({
  hasNotificationPermission: jest.fn(async () => true),
  requestNotificationPermission: jest.fn(async () => true),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(async () => 'task_deadline'),
    createTriggerNotification: jest.fn(async () => 'id'),
    displayNotification: jest.fn(async () => 'id'),
    cancelNotification: jest.fn(async () => undefined),
  },
  TriggerType: { TIMESTAMP: 0 },
  AndroidImportance: { DEFAULT: 3 },
}));

const NOW = new Date(2026, 9, 1, 14, 0, 0);

type Counts = { total: number; pending: number };

function load(counts: Counts = { total: 3, pending: 3 }) {
  jest.resetModules();
  const service = require('../src/services/taskDeadlineNotifications');
  const notifee = require('@notifee/react-native').default;
  const permission = require('../src/services/notificationPermission');
  const state = { counts };
  service.configureTaskDeadlineNotifications({
    getTaskCountsByDate: (keys: string[]) =>
      Object.fromEntries(keys.map(key => [key, state.counts])),
    getCountdowns: () => [],
  });
  return { service, notifee, permission, state };
}

describe('syncTaskDeadlineNotifications', () => {
  it('schedules an 11 PM reminder for each day with pending tasks', async () => {
    const { service, notifee } = load();

    await service.syncTaskDeadlineNotifications(NOW);

    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(7);
    const [notification, trigger] =
      notifee.createTriggerNotification.mock.calls[0];
    expect(notification.id).toBe('taskdl-tasks-2026-10-01');
    expect(notification.body).toBe('3 tasks still open.');
    expect(trigger.timestamp).toBe(new Date(2026, 9, 1, 23, 0, 0).getTime());
  });

  it('cancels the previous batch before scheduling again', async () => {
    const { service, notifee } = load();

    await service.syncTaskDeadlineNotifications(NOW);
    expect(notifee.cancelNotification).not.toHaveBeenCalled();

    await service.syncTaskDeadlineNotifications(NOW);
    expect(notifee.cancelNotification).toHaveBeenCalledTimes(7);
    expect(notifee.cancelNotification).toHaveBeenCalledWith(
      'taskdl-tasks-2026-10-01'
    );
  });

  it('schedules nothing when notification permission is missing', async () => {
    const { service, notifee, permission } = load();
    permission.hasNotificationPermission.mockResolvedValue(false);

    await service.syncTaskDeadlineNotifications(NOW);

    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('is on by default', () => {
    const { service } = load();
    expect(service.getTaskDeadlineNotificationsEnabled()).toBe(true);
  });

  it('cancels everything and stays quiet when disabled', async () => {
    const { service, notifee } = load();
    await service.syncTaskDeadlineNotifications(NOW);

    await service.setTaskDeadlineNotificationsEnabled(false);
    expect(notifee.cancelNotification).toHaveBeenCalledTimes(7);

    await service.syncTaskDeadlineNotifications(NOW);
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(7);
  });

  it('asks for permission, including on iOS, when the toggle is turned on', async () => {
    const { service, permission } = load();
    await service.setTaskDeadlineNotificationsEnabled(false);

    await service.setTaskDeadlineNotificationsEnabled(true);

    expect(permission.requestNotificationPermission).toHaveBeenCalledWith(
      'settings_task_deadline',
      { allowIos: true }
    );
  });
});

describe('handleTaskDeadlineDataChanged', () => {
  it('shows one completion notification when the last pending task is done', async () => {
    const { service, notifee, state } = load({ total: 2, pending: 2 });
    await service.refreshTaskDeadlineNotifications(NOW);

    state.counts = { total: 2, pending: 0 };
    await service.handleTaskDeadlineDataChanged(NOW);

    expect(notifee.displayNotification).toHaveBeenCalledTimes(1);
    const arg = notifee.displayNotification.mock.calls[0][0];
    expect(arg.title).toBe('All done');
    expect(arg.body).toBe('2 of 2 tasks finished today.');
  });

  it('does not send the 11 PM reminder for a day that is fully done', async () => {
    const { service, notifee, state } = load({ total: 2, pending: 2 });
    await service.refreshTaskDeadlineNotifications(NOW);
    notifee.createTriggerNotification.mockClear();

    state.counts = { total: 2, pending: 0 };
    await service.handleTaskDeadlineDataChanged(NOW);

    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('notifies at most once per day', async () => {
    const { service, notifee, state } = load({ total: 2, pending: 2 });
    await service.refreshTaskDeadlineNotifications(NOW);

    state.counts = { total: 2, pending: 0 };
    await service.handleTaskDeadlineDataChanged(NOW);

    state.counts = { total: 3, pending: 1 };
    await service.handleTaskDeadlineDataChanged(NOW);
    state.counts = { total: 3, pending: 0 };
    await service.handleTaskDeadlineDataChanged(NOW);

    expect(notifee.displayNotification).toHaveBeenCalledTimes(1);
  });

  it('stays quiet when tasks are removed instead of completed', async () => {
    const { service, notifee, state } = load({ total: 1, pending: 1 });
    await service.refreshTaskDeadlineNotifications(NOW);

    state.counts = { total: 0, pending: 0 };
    await service.handleTaskDeadlineDataChanged(NOW);

    expect(notifee.displayNotification).not.toHaveBeenCalled();
  });

  it('does not fire on app open when everything is already done', async () => {
    const { service, notifee } = load({ total: 2, pending: 0 });

    await service.refreshTaskDeadlineNotifications(NOW);

    expect(notifee.displayNotification).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx jest __tests__/taskDeadlineNotifications.test.ts`
Expected: FAIL with "Cannot find module '../src/services/taskDeadlineNotifications'".

- [ ] **Step 5: Write the service**

Create `src/services/taskDeadlineNotifications.ts`:

```ts
/**
 * Local notifications for daily tasks and countdown deadlines.
 *
 * - 11 PM reminder when a day still has unfinished tasks.
 * - One instant notification when the last task of today is checked off.
 * - 8 AM and 11 PM notices on a countdown's final day.
 */

import { Platform } from 'react-native';
import { getLocalDateKey } from '../domain/notifications/retentionNotificationCopy';
import {
  buildTaskCompletionCopy,
  buildTaskDeadlineSchedule,
  getWindowDateKeys,
  type TaskDayCounts,
  type TaskDeadlineCountdown,
} from '../domain/notifications/taskDeadlineCopy';
import { getString, setString } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import {
  hasNotificationPermission,
  requestNotificationPermission,
} from './notificationPermission';

const CHANNEL_ID = 'task_deadline';
const CHANNEL_NAME = 'Tasks and deadlines';
const DEFAULT_ENABLED = true;
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

async function runSync(now: Date): Promise<void> {
  if (!isSupportedPlatform()) return;
  if (!getTaskDeadlineNotificationsEnabled()) {
    await cancelScheduled();
    return;
  }
  if (!(await hasNotificationPermission())) {
    await cancelScheduled();
    return;
  }

  const schedule = buildTaskDeadlineSchedule({
    now,
    taskCountsByDate: source.getTaskCountsByDate(getWindowDateKeys(now)),
    countdowns: source.getCountdowns(),
  });

  try {
    const notifee = require('@notifee/react-native').default;
    const { TriggerType } = require('@notifee/react-native');
    await ensureChannel();
    await cancelScheduled();

    const ids: string[] = [];
    for (const item of schedule) {
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
    await cancelScheduled();
  }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx jest __tests__/taskDeadlineNotifications.test.ts __tests__/taskDeadlineCopy.test.ts`
Expected: PASS for both files.

- [ ] **Step 7: Check the storage ownership guard**

Run: `npx jest __tests__/storageKeyOwnership.test.ts`
Expected: PASS. The three new keys appear only in `taskDeadlineNotifications.ts`.

---

### Task 3: Composition root wiring

**Files:**
- Modify: `src/di.ts` (import near line 144, wiring after the `configureRetentionNotifications` block near line 572)

**Interfaces:**
- Consumes (Task 2): `configureTaskDeadlineNotifications`, `queueTaskDeadlineSync`, `TaskDeadlineSource`.
- Consumes (Task 1): `type TaskDayCounts`.
- Consumes (existing in `di.ts`): `getStoredTasksForDayUseCase`, `countdownRepository`, `taskRepository`.
- Produces: nothing new. Task and countdown changes now trigger `queueTaskDeadlineSync()`.

Design adjustment: the source uses `getStoredTasksForDayUseCase`, not `getTasksForDayUseCase`. The second one writes repeat-daily tasks into storage as a side effect. A notification sync should not create tasks for future days.

- [ ] **Step 1: Add the imports**

After the existing line `import { configureRetentionNotifications } from './services/retentionNotifications';` add:

```ts
import {
  configureTaskDeadlineNotifications,
  queueTaskDeadlineSync,
} from './services/taskDeadlineNotifications';
import type { TaskDayCounts } from './domain/notifications/taskDeadlineCopy';
```

- [ ] **Step 2: Add the wiring**

After the `configureRetentionNotifications({ ... });` block add:

```ts
configureTaskDeadlineNotifications({
  getTaskCountsByDate: dateKeys => {
    const counts: Record<string, TaskDayCounts> = {};
    for (const dateKey of dateKeys) {
      const tasks = getStoredTasksForDayUseCase.execute(dateKey);
      counts[dateKey] = {
        total: tasks.length,
        pending: tasks.filter(task => !task.completed).length,
      };
    }
    return counts;
  },
  getCountdowns: () =>
    countdownRepository.getAll().map(({ id, title, date }) => ({
      id,
      title,
      date,
    })),
});
taskRepository.subscribe(queueTaskDeadlineSync);
countdownRepository.subscribe(queueTaskDeadlineSync);
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors in `src/di.ts` or the new files.

---

### Task 4: Resync on app open and foreground

**Files:**
- Modify: `src/app.tsx` (import near line 41, calls near lines 170 and 205)

**Interfaces:**
- Consumes (Task 2): `refreshTaskDeadlineNotifications(now?: Date): Promise<void>`.

- [ ] **Step 1: Add the import**

After `import { schedulePresenceStreakSaver } from './services/presenceStreakNotifications';` add:

```ts
import { refreshTaskDeadlineNotifications } from './services/taskDeadlineNotifications';
```

- [ ] **Step 2: Call it on startup**

Replace:

```ts
    scheduleRetentionNotifications().catch(() => {});
    syncWidgetCache();
```

with:

```ts
    scheduleRetentionNotifications().catch(() => {});
    refreshTaskDeadlineNotifications().catch(() => {});
    syncWidgetCache();
```

- [ ] **Step 3: Call it on return to foreground**

Replace:

```ts
        scheduleRetentionNotifications().catch(() => {});
        verifySubscriptionUseCase.execute().then(() => syncPremiumStatus());
```

with:

```ts
        scheduleRetentionNotifications().catch(() => {});
        refreshTaskDeadlineNotifications().catch(() => {});
        verifySubscriptionUseCase.execute().then(() => syncPremiumStatus());
```

---

### Task 5: Settings toggle

**Files:**
- Create: `src/hooks/useTaskDeadlineNotifications.ts`
- Modify: `src/hooks/index.ts` (after line 32)
- Modify: `src/surfaces/app/SettingsScreen.tsx` (hooks import near line 26, hook call near line 99, new row after the "Daily Time Reminders" row near line 573)

**Interfaces:**
- Consumes (Task 2): `getTaskDeadlineNotificationsEnabled`, `setTaskDeadlineNotificationsEnabled`.
- Produces: `useTaskDeadlineNotifications(): { enabled: boolean; setEnabled: (enabled: boolean) => void }`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useTaskDeadlineNotifications.ts`:

```ts
import { useCallback, useState } from 'react';
import {
  getTaskDeadlineNotificationsEnabled,
  setTaskDeadlineNotificationsEnabled,
} from '../services/taskDeadlineNotifications';

export function useTaskDeadlineNotifications(): {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
} {
  const [enabled, setEnabledState] = useState(() =>
    getTaskDeadlineNotificationsEnabled()
  );

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    setTaskDeadlineNotificationsEnabled(nextEnabled).catch(() => {
      setEnabledState(getTaskDeadlineNotificationsEnabled());
    });
  }, []);

  return { enabled, setEnabled };
}
```

- [ ] **Step 2: Export it**

In `src/hooks/index.ts`, after `export { useRetentionNotifications } from './useRetentionNotifications';` add:

```ts
export { useTaskDeadlineNotifications } from './useTaskDeadlineNotifications';
```

- [ ] **Step 3: Import and call the hook in Settings**

In `src/surfaces/app/SettingsScreen.tsx`, in the import list from the hooks module that contains `useRetentionNotifications,` add `useTaskDeadlineNotifications,` on the next line.

Replace:

```tsx
  } = useRetentionNotifications();
  const { analyticsEnabled, analyticsLocked, setAnalyticsEnabled } =
```

with:

```tsx
  } = useRetentionNotifications();
  const {
    enabled: taskDeadlineRemindersEnabled,
    setEnabled: setTaskDeadlineRemindersEnabled,
  } = useTaskDeadlineNotifications();
  const { analyticsEnabled, analyticsLocked, setAnalyticsEnabled } =
```

- [ ] **Step 4: Add the toggle row**

Replace:

```tsx
                <View style={[styles.row, styles.rowLast]}>
                  <View style={styles.rowContent}>
                    <Text variant="body" style={{ color: theme.textPrimary }}>
                      Share usage stats
                    </Text>
```

with:

```tsx
                <View style={styles.row}>
                  <View style={styles.rowContent}>
                    <Text variant="body" style={{ color: theme.textPrimary }}>
                      Task and deadline reminders
                    </Text>
                    <Text
                      variant="caption"
                      style={[
                        styles.rowSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Reminder at 11 PM if tasks are open. Alerts on deadline
                      days.
                    </Text>
                  </View>
                  <Switch
                    value={taskDeadlineRemindersEnabled}
                    onValueChange={setTaskDeadlineRemindersEnabled}
                    trackColor={{
                      false: theme.divider,
                      true: 'rgba(232, 124, 32, 0.45)',
                    }}
                    thumbColor={
                      taskDeadlineRemindersEnabled
                        ? theme.percent
                        : theme.textSecondary
                    }
                  />
                </View>
                <View style={[styles.row, styles.rowLast]}>
                  <View style={styles.rowContent}>
                    <Text variant="body" style={{ color: theme.textPrimary }}>
                      Share usage stats
                    </Text>
```

- [ ] **Step 5: Check lints on edited files**

Run: `npx eslint src/surfaces/app/SettingsScreen.tsx src/hooks/useTaskDeadlineNotifications.ts src/hooks/index.ts`
Expected: no errors.

---

### Task 6: Verify everything and update the spec

**Files:**
- Modify: `docs/superpowers/specs/2026-10-01-task-deadline-notifications-design.md`

- [ ] **Step 1: Update the spec**

Make three edits:

1. In section 4, replace "backed by the existing task use case (so repeat-daily and carryover rules match the Today screen)" with "backed by `getStoredTasksForDayUseCase`, which reads stored tasks only. `getTasksForDayUseCase` is avoided because it writes repeat-daily tasks into storage."
2. In section 2, replace "Permission: sync checks existing permission and schedules only if granted. It never prompts. Turning the toggle on in Settings calls `requestNotificationPermission`." with the same text plus: "A new `hasNotificationPermission()` in `notificationPermission.ts` reads the status on both platforms. `requestNotificationPermission` gets an `allowIos` option, because it returned `false` on iOS before."
3. In section 4, replace the sentence about completion detection with: "Completion fires only on a transition from pending greater than 0 to 0 with total greater than 0, tracked in memory per app session. App open resets that baseline, so opening the app never triggers it. All toggles go through `useDailyTasks` and the task repository, so the repository subscription covers them."

- [ ] **Step 2: Run the full checks**

Run: `npx jest`
Expected: all suites pass, including the two new ones and `storageKeyOwnership`.

Run: `npm run lint`
Expected: no errors.

Run: `npm run lint:cycles`
Expected: no circular dependencies reported.

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 3: Manual check on a device or emulator**

1. Open Settings. Confirm "Task and deadline reminders" is on.
2. Add two tasks for today. Check them off one at a time. The second one should show "All done / 2 of 2 tasks finished today." once.
3. Uncheck one task, check it again. No second notification.
4. Add a task for today and leave it open. Set the device clock to 10:59 PM. At 11:00 PM expect "1 hour left today / 1 task still open."
5. Add a countdown dated today. Expect the 11 PM "is due tonight" notice, and the 8 AM one if you set it earlier.
6. Turn the toggle off. Expect no scheduled notifications to fire.

---

## Self-review

**Spec coverage**
- 11 PM pending reminder: Task 1 builder, Task 2 service.
- Instant completion, once per day, cancels that day's reminder: Task 2 (`handleTaskDeadlineDataChanged` resyncs first, so the reminder drops out of the schedule).
- Deadline 8 AM and 11 PM: Task 1.
- Zero tasks sends nothing: Task 1 tests, Task 2 `total > 0` check.
- Android and iOS, own channel: Task 2.
- Settings toggle, default on, permission only requested from the toggle: Tasks 2 and 5.
- Re-sync on repository changes, app open, foreground: Tasks 3 and 4.
- Storage ownership: Task 2 step 7.
- Copy rules: all strings checked, no em dashes.

**Placeholder scan:** none.

**Type consistency:** `TaskDayCounts`, `TaskDeadlineCountdown`, `buildTaskDeadlineSchedule`, `buildTaskCompletionCopy`, `getWindowDateKeys` are defined in Task 1 and used with the same signatures in Tasks 2 and 3. Service exports in Task 2 match their use in Tasks 3, 4, and 5.
