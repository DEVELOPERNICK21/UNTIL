# Task and deadline notifications

Date: 2026-10-01
Status: design approved, spec pending review

## Goal

Send local notifications for daily tasks and countdown deadlines:

- Last hour of the day (11:00 PM): remind the user if today has unfinished tasks.
- When the last task of today is checked off: tell the user everything is done.
- Countdown deadlines: notify on the final day of the countdown, in the morning and in the last hour.

## Decisions

| Question | Decision |
|---|---|
| Last-hour time | 11:00 PM local time |
| Completion | Immediate local notification when the last task of today is completed. No 11 PM reminder that day. |
| Deadline | `Countdown.date` is the deadline. Notify at 8:00 AM and 11:00 PM on that date. |
| Zero tasks today | No notification |
| Platforms | Android and iOS |
| Settings | New toggle, on by default, schedules only if notification permission is already granted |

## Non-goals

- Due dates on individual tasks.
- Quiet hours, snooze, or custom times.
- Server push.

## Architecture

Follows `.cursor/rules/architecture.mdc`. Services cannot import `di`, so data comes in through injected sources, the same way `configureRetentionNotifications` works.

### 1. `src/domain/notifications/taskDeadlineCopy.ts` (pure)

```ts
interface TaskDeadlineScheduleInput {
  now: Date;
  daysAhead: number; // 7
  taskCountsByDate: Record<string, { total: number; pending: number }>; // key: YYYY-MM-DD
  countdowns: { id: string; title: string; date: string }[];
}

interface TaskDeadlineScheduleItem {
  id: string;
  kind: 'tasks_pending' | 'deadline_morning' | 'deadline_last_hour';
  title: string;
  body: string;
  triggerAt: Date;
}

buildTaskDeadlineSchedule(input): TaskDeadlineScheduleItem[]
buildTaskCompletionCopy(total: number): { title: string; body: string }
```

Rules:

- `tasks_pending`: for each day in the window with `pending > 0`, trigger at 23:00 local. Skip if the trigger time is not after `now`.
- `deadline_morning`: for each countdown whose date is in the window, trigger at 08:00 on that date. Skip if not after `now`.
- `deadline_last_hour`: same, at 23:00.
- Ids: `taskdl-tasks-<dateKey>`, `taskdl-dl-am-<countdownId>-<dateKey>`, `taskdl-dl-pm-<countdownId>-<dateKey>`.
- Past countdowns and dates outside the window produce nothing.

Copy (no em dashes, per `human-copy.mdc`):

| Kind | Title | Body |
|---|---|---|
| `tasks_pending` | `1 hour left today` | `3 tasks still open.` (singular: `1 task still open.`) |
| completion | `All done` | `5 of 5 tasks finished today.` |
| `deadline_morning` | `Due today` | `{title} is due today.` |
| `deadline_last_hour` | `1 hour left` | `{title} is due tonight.` |

### 2. `src/services/taskDeadlineNotifications.ts`

Same layer as `retentionNotifications.ts`.

- `configureTaskDeadlineNotifications(source)`, called from `di.ts`. Source provides:
  - `getTaskCountsByDate(dateKeys: string[])`
  - `getCountdowns()`
- `syncTaskDeadlineNotifications(now?)`: build the schedule, cancel previous ids, create trigger notifications with Notifee, save the new ids.
- `notifyTasksCompleted(total, now?)`: shows one immediate notification, at most once per local day, and cancels that day's `tasks_pending` notification.
- `getTaskDeadlineNotificationsEnabled()` / `setTaskDeadlineNotificationsEnabled(enabled)`.
- Notifee channel `task_deadline`, name "Tasks and deadlines".
- Notifee is loaded with `require` inside try/catch, like the existing services. Failures are swallowed.
- Not enabled: cancel everything and return.
- Permission: sync checks existing permission and schedules only if granted. It never prompts. Turning the toggle on in Settings calls `requestNotificationPermission`.

### 3. Storage keys (`src/persistence/schema.ts`)

Owned only by `taskDeadlineNotifications.ts`:

- `TASK_DEADLINE_NOTIFICATIONS_ENABLED`
- `TASK_DEADLINE_NOTIFICATIONS_IDS`
- `TASK_DEADLINE_COMPLETION_NOTIFIED_DATE`

Native widgets do not read these keys.

### 4. Composition root (`src/di.ts`)

- Add `configureTaskDeadlineNotifications` with sources backed by the existing task use case (so repeat-daily and carryover rules match the Today screen) and `countdownRepository.getAll()`.
- Subscribe to task and countdown repositories and call `syncTaskDeadlineNotifications()` on change, debounced to avoid repeated work on bulk edits.
- Completion detection: after a task toggle, if today has `total > 0` and `pending === 0` and today has not been notified, call `notifyTasksCompleted`. This lives in the subscribe callback so any path that completes a task triggers it. The only toggle path to verify during planning is `ToggleTaskUseCase` and anything that bypasses it.

### 5. App lifecycle (`src/app.tsx`)

Call `syncTaskDeadlineNotifications()` next to the existing `scheduleRetentionNotifications()` calls on startup and on return to foreground. This keeps future days correct, since only stored tasks are known in advance.

### 6. Settings

- `src/hooks/useTaskDeadlineNotifications.ts`, shaped like `useRetentionNotifications`.
- New switch in `SettingsScreen.tsx` next to the retention switch, using the existing row styling.
- Visible strings follow `human-copy.mdc`. Suggested label: "Task and deadline reminders". Suggested helper: "Reminder at 11 PM if tasks are open. Alerts on deadline days."

## Edge cases

- Task checked off after 11 PM scheduling: the next sync cancels the pending reminder.
- Task added after the user already completed everything today: completion flag stays set for the day, so no duplicate completion notification. A new 11 PM reminder is scheduled because pending is greater than 0 again.
- Countdown deleted: next sync drops its ids.
- Countdown date is today and 8:00 AM has passed: only the 11 PM notification is scheduled.
- Device timezone change or DST: dates are computed from local `Date` parts, and the app resyncs on foreground.
- User never opens the app for days: scheduled notifications for already-known data still fire. Future days use the last stored task data.
- Notification permission denied: nothing is scheduled, no error shown.

## Testing

Jest tests in `__tests__/taskDeadlineCopy.test.ts` for the pure builder:

- Pending tasks produce one 23:00 item with correct singular/plural body.
- No pending tasks, or zero tasks, produce no item.
- 23:00 already passed today skips today and still schedules tomorrow.
- Countdown today before 8 AM, between 8 AM and 11 PM, after 11 PM.
- Countdown tomorrow, outside the window, and in the past.
- Multiple countdowns on the same day get distinct ids.
- Completion copy for 1 task and many tasks.

Service tests with a mocked Notifee module:

- Disabled setting cancels and schedules nothing.
- Sync cancels the previous ids before scheduling.
- Completion notification fires once per day.

Existing checks: `npm run lint`, `npm run lint:cycles`, and `__tests__/storageKeyOwnership.test.ts` must still pass.
