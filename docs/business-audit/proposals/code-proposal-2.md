# Code proposal #2 — sessions, widgets, notifications, identity (NOT APPLIED)

Status: **prepared and tested in a scratch copy; nothing in the app has been changed.** Two patches, so the native part is a separate decision:

| Patch | Contents | Size |
|-------|----------|------|
| [code-proposal-2-app.patch](code-proposal-2-app.patch) | TypeScript: 18 source files + `index.js`, 9 test files | +1,125 / −72 |
| [code-proposal-2-android.patch](code-proposal-2-android.patch) | Kotlin: 4 files (`WidgetHealth.kt` is new) | +63 / −0 |

Implements the items listed in [04](../04-analytics-tracking-plan.md) (gaps 3, 4, 9; §4 events `widget_inventory`, `widget_stale`, `notification_opened`, `session_start_app`) and the overlay `onTimeout` item in [02](../02-app-performance-scorecard.md). Apply with (repo root, not a git repo):

```bash
git apply --check -p1 docs/business-audit/proposals/code-proposal-2-app.patch && git apply -p1 docs/business-audit/proposals/code-proposal-2-app.patch
git apply --check -p1 docs/business-audit/proposals/code-proposal-2-android.patch && git apply -p1 docs/business-audit/proposals/code-proposal-2-android.patch
```

The app patch works without the Android one (`widget_stale` then never fires; nothing breaks). The Android patch is independent of the session and identity changes.

## What changes

| # | Change | Before → after |
|---|--------|----------------|
| 1 | **Opens are sessions, not foregrounds.** `TrackAppOpenUseCase` counts a foreground only when it starts a session: a cold start, or a return after 30+ minutes in the background (`appSessionTracker.ts`, in memory; only `background` counts, not iOS `inactive`). New event `session_start_app {session_index, days_since_install}`. `app_open` still fires on every foreground (telemetry). | `appOpenCount` rose on every return to the app. Now the Life unlock (3rd session), the reminder opt-in sheet (5), the review prompt (5 and 3 days), the feature coach and the "opens_50" badge all measure sessions. The 24 h Life window still refreshes on every foreground once unlocked. Existing users keep their stored count; it just grows more slowly. |
| 2 | **Firebase user properties and user id.** `is_premium`, `app_language`, `reminders_on`, `onboarding_goal`, `onboarding_complete`, `has_widget`, `widget_count`, plus `setUserId` (same id PostHog uses). Sent only when changed, only with analytics consent. The Firebase accessor moved out of `analytics.ts` into `firebaseAnalytics.ts`. | Firebase could not split retention by premium, language or widget owner. `analytics.ts` goes from 362 to 327 lines, and its line cap in `architecture.test.ts` is lowered to match. |
| 3 | **`widget_inventory`** (kinds on the home screen, from the existing native `getWidgetStatus` on Android and iOS; logged when the set changes) and **`widget_stale`** (Android: hours since the periodic background refresh, 3+ hours, with manufacturer, at most every 6 h). | No widget telemetry. `widget_count` counts **kinds** (day, month, year, …), not placed instances: that is what the native status reports. |
| 4 | **`notification_opened {type, source}`.** Notifee foreground presses, the launch tap (`getInitialNotification`) and a background handler registered in `index.js`. Types: retention, winback, task, streak, trial, day2, other (by `data.type`, else id prefix). Win-back items now carry `data.type: 'winback'`. | No tap tracking at all (no Notifee press handler existed). |
| 5 | **PostHog alias.** When someone signs in on a device PostHog already knew by its device id, the account id is aliased before `identify`. | One person became two in funnels and retention. |
| 6 | **Android:** `UNTILWidgetWorker` records when it last ran (`WidgetHealth`), `WidgetBridge.getWidgetHealth` exposes it, and `UNTILOverlayService.onTimeout` stops the service. | On Android 15 a `dataSync` foreground service that does not stop when the system times it out crashes the app. This is a **hypothesis** for the Android crash rate: the Crashlytics traces (A7 in [DATA_REQUESTS](../DATA_REQUESTS.md)) decide whether it matters. |

## Decisions and caveats

1. **Opens now mean sessions.** Anything that was reached in "N opens" is reached later (a person who flips in and out of the app four times in a minute used to hit the review prompt's five opens; now they do not). I think that is the point, but it also delays the Life unlock for new users. Say if you would rather keep the old counter and add a separate session counter.
2. **A cold start inside 30 minutes is a new session.** The tracker is in memory; a killed process is a new process. Persisting the background time would fix it and needs a new storage key.
3. **Firebase user id.** `setFirebaseUserId(distinctId)` sends the account id when signed in, else the random device id (the same ids PostHog and Crashlytics already get). If you do not want a user id in Firebase, delete that one line and the property still works. Check that your privacy policy and the Play Data safety form already cover user ids.
4. **GA4 custom dimensions must be registered by you** (Admin → Custom definitions → User scope) for each property, or the properties are collected but not reportable.
5. **Overlay `onTimeout` only stops the island.** After a timeout the overlay is off until the person turns it on again; there is no automatic restart or "paused" notification (that would need strings in 11 languages). It never runs below Android 15.
6. **`widget_stale` is a reliability signal, not a verdict.** After a night in Doze the first morning open will often read several hours. Compare by manufacturer and hour of day, not as an absolute.
7. **The PostHog merge is not verified server-side.** After applying, sign in on a test device that was anonymous and check in PostHog that the device-id person and the account person are one.
8. Notifications scheduled **before** the update keep their old `data.type`, so win-back taps are told apart only once the retention schedule is rebuilt (at most every 6 hours, on a foreground). Task, streak, trial and day-2 taps are classified by id prefix and work at once.

## What this does **not** include

- **Revenue events for purchases made on the RevenueCat dashboard paywall.** Still only `onboarding_paywall_result: purchased`. The fix is the RevenueCat → Firebase and → PostHog integrations (console, no code), or a follow-up that logs an event from the existing `customerInfo` listener. Tell me if you want that as proposal #3.
- RevenueCat subscriber attributes (`$firebaseAppInstanceId`, `$posthogUserId`, campaign) for joining server events to product events.
- The Wear OS / Apple Watch "Life is free on the watch, Premium on the phone" mismatch. That is a product decision (which side changes), not an analytics fix; I mis-filed it under this proposal in the first write-up.
- A "tap to refresh" hint for stale widgets, and iOS widget staleness (WidgetKit refresh is controlled by the OS).

## How it was checked (scratch copy; not on a device)

| Check | Result |
|-------|--------|
| Full jest suite, before | 100 of 103 suites pass (833 tests). The 3 failures: `desktopStandards` (the scratch copy omits `desktop/src-tauri`) and two screen tests that time out under load. |
| Full jest suite, after | 107 of 110 suites pass (**875** tests, +42); the same 3 fail for the same reasons. Architecture (line caps, layer rules), SSOT and storage-key tests pass. Suites touched after that run (the three test files made modules) were re-run and pass. |
| `tsc --noEmit` | The error set is **identical** to the original's (75 pre-existing errors; none new). |
| eslint on changed folders | 0 errors. |
| Kotlin | `./gradlew :app:compileDebugKotlin --offline` on a scratch copy: **BUILD SUCCESSFUL**; the only warning (`UNTILWidgetPackage.kt`) is older than this change. Not run on a device, so `getWidgetHealth` and `onTimeout` have not executed. |
| Patches | Both applied to a fresh copy and compared file by file with the tested tree; `git apply --check` passes against the real tree. |

**Not verified:** anything that needs a device or a console: events arriving in Firebase DebugView / PostHog, GA4 user properties appearing, the notification tap handlers on Android 13+ and iOS, `getWidgetHealth` returning a value after the worker runs, and the Android 15 timeout itself.

## Caveat on this working tree

`.worktrees/` holds eight other copies of the app that differ from the main tree in files these patches touch (for example `analytics.ts`). The patches are against the main tree only.
