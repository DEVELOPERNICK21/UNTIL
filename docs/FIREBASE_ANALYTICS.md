# Firebase Analytics & Crashlytics

UNTIL uses Firebase project **until-b7624** (number `150745476537`).

Android package: `app.until.time` — config file: `android/app/google-services.json` (fetched via Firebase CLI).

UNTIL logs product events via [`src/services/analytics.ts`](../src/services/analytics.ts). Events are sent to Firebase when native modules are installed and `google-services.json` is present. The same events are **dual-written to PostHog** when configured — see [`POSTHOG_ANALYTICS.md`](./POSTHOG_ANALYTICS.md).

## Setup (Android)

1. Project is already created: `until-b7624`. Android app is registered as `app.until.time`.
2. Refresh config if needed:

   ```bash
   npx -y firebase-tools@latest apps:sdkconfig ANDROID 1:150745476537:android:f314fbd3ede63d5d399a68 --project until-b7624 > android/app/google-services.json
   ```

3. Install packages (already in `package.json`):

   ```bash
   yarn install
   cd ios && pod install && cd ..
   ```

4. Rebuild a **release** (or internal) APK/AAB so Crashlytics collection is enabled.

## Events

| Event | When | Key properties |
|-------|------|----------------|
| `app_open` | App launch / foreground | — |
| `onboarding_step` | Carousel step (1–3) | `step`, `step_name` |
| `onboarding_complete` | User reaches Home | `exit_type`, `step`, `step_name` |
| `identity_setup_complete` | Optional Settings path | — |
| `life_preview_seen` | Optional life-weeks preview | — |
| `onboarding_paywall_seen` | Deferred paywall | `deferred` |
| `widget_coach_shown` / `widget_coach_dismissed` | Widget coach modal | `dismiss_reason` |
| `widget_add_tapped` | Coach CTA | `source` |
| `premium_viewed` | Paywall shown | `source` |
| `premium_purchase_*` | Google Play billing funnel | `plan_id`, `source`, `error_code`, `payment_provider` |
| `countdown_created` / `countdown_completed` | Deadline widget actions | `days_until`, `days_used` |
| `share_tapped` / `share_completed` | Share snapshot | `source_screen`, `focus` |
| `notification_permission_result` | Android notification permission | `granted`, `source` |
| `feature_coach_*` / `share_prompt_*` | Feature discovery & share prompts | `target`, `dismiss_reason` |
| `trial_preview_started` / `trial_preview_ended` | In-app preview lifecycle | `converted`, `trial_days` |

PostHog also receives **Application Installed** via SDK lifecycle autocapture (see PostHog doc).

## Crashlytics

Firebase Crashlytics reports **native crashes** automatically and **non-fatal JS errors** via helpers in [`src/services/analytics.ts`](../src/services/analytics.ts).

### What is wired

| Piece | Where |
|-------|--------|
| Android Gradle plugin | `android/build.gradle` + `android/app/build.gradle` (when `google-services.json` exists) |
| iOS upload script | Xcode `[RNFB] Crashlytics Configuration` (from CocoaPods) |
| React ErrorBoundary | `CrashErrorBoundary` wraps the app in `src/app.tsx` |
| Non-fatals | `recordCrashError(error, context)` in purchase, share, update-config, trial/verify adapters |
| User context | `setCrashUserId(deviceId)` + `setCrashAttributes(...)` via analytics bootstrap |
| Collection | Enabled in release (`initCrashlyticsCollection`); disabled in `__DEV__` |

### Reporting non-fatals

```ts
import { recordCrashError, logCrashBreadcrumb } from '../services/analytics';

try {
  await riskyWork();
} catch (e) {
  logCrashBreadcrumb('optional breadcrumb');
  recordCrashError(e, 'MyFeature.riskyWork');
}
```

### Verify in Firebase console

1. Ensure `android/app/google-services.json` and iOS `GoogleService-Info.plist` are present for a release/internal build.
2. Trigger a non-fatal (e.g. force a purchase network failure) or a test crash in a **non-debug** build.
3. Open Firebase → Crashlytics; reports can take a few minutes.

To force Crashlytics in debug builds temporarily, set `crashlytics_debug_enabled` to `true` in root `firebase.json` and rebuild.

## Dev

Without Firebase config, events log to console in `__DEV__` only.
