# Firebase Analytics & Crashlytics

UNTIL logs product events via [`src/services/analytics.ts`](../src/services/analytics.ts). Events are sent to Firebase when native modules are installed and `google-services.json` is present.

## Setup (Android)

1. Create a Firebase project and add Android app `app.until.time`.
2. Download `google-services.json` into `android/app/google-services.json` (see `google-services.json.example`).
3. Install packages (already in `package.json` after growth work):

   ```bash
   yarn install
   cd ios && pod install && cd ..
   ```

4. Rebuild release/debug APK.

Gradle applies the Google Services plugin only when `android/app/google-services.json` exists.

## Events

| Event | When |
|-------|------|
| `app_open` | App launch / foreground |
| `onboarding_step` | Carousel step (1–3) |
| `onboarding_complete` | User reaches Home (short onboarding) |
| `identity_setup_complete` | Optional Settings path |
| `life_preview_seen` | Optional life-weeks preview |
| `onboarding_paywall_seen` | Deferred paywall |
| `widget_coach_shown` / `widget_coach_dismissed` | Widget coach modal |
| `widget_add_tapped` | Coach CTA |
| `premium_viewed` | Premium screen |

## Crashlytics

Use `recordCrashError(error, context)` from `analytics.ts` in catch blocks for non-fatal reporting.

## Dev

Without Firebase config, events log to console in `__DEV__` only.
