# Task deadline notifications review fixes

## Status

DONE_WITH_CONCERNS

## Fixes

- Set `DEFAULT_ENABLED=false` in `src/services/taskDeadlineNotifications.ts`. Unset storage now means off. Sync and refresh still only call `hasNotificationPermission` (read-only). `requestNotificationPermission({ allowIos: true })` still runs only in `setTaskDeadlineNotificationsEnabled(true)`.
- Added a `syncGeneration` token so an in-flight sync aborts if the user turns the feature off after it started. Disable bumps the generation, cancels, awaits the in-flight queue, then cancels again.
- Tests: "is off by default"; sync/completion cases enable first via `setTaskDeadlineNotificationsEnabled(true)`; new race test hangs `createChannel`, disables, then lets the sync finish and asserts no `createTriggerNotification`. Optional countdown test asserts morning/evening trigger ids.
- Spec: Settings row is off by default. Section 4 now reads `getStoredTasksForDayUseCase` and `countdownRepository.getAll()` as one source list. No PascalCase leftover use-case names in that spec. Settings UI copy unchanged.

## Files changed

- `src/services/taskDeadlineNotifications.ts`
- `__tests__/taskDeadlineNotifications.test.ts`
- `docs/superpowers/specs/2026-10-01-task-deadline-notifications-design.md`
- `.superpowers/sdd/final-review-fix-report.md`

Did not edit `di.ts`, `app.tsx`, `schema.ts`, the Settings hook, or Ember WIP. No git commit.

## Test results

Command:

`npx jest --watchman=false __tests__/taskDeadlineNotifications.test.ts --no-coverage`

- PASS
- 1 suite, 13 tests passed, 0 failed
- 0 snapshots

Also ran:

`npx jest --watchman=false __tests__/taskDeadlineCopy.test.ts __tests__/taskDeadlineNotifications.test.ts --no-coverage`

- PASS
- 2 suites, 28 tests passed, 0 failed

## Leftover concerns

- `docs/superpowers/plans/2026-10-01-task-deadline-notifications.md` still says default `true` / "is on by default". Out of the requested spec/code fix set; product behavior and the design spec match default-off.
