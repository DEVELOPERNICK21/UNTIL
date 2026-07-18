# PostHog Analytics

UNTIL sends product events to **PostHog** and **Firebase Analytics** via [`src/services/analytics.ts`](../src/services/analytics.ts). Crash reporting stays on **Firebase Crashlytics**.

Full implementation spec: [`POSTHOG_ANALYTICS_SPEC.md`](./POSTHOG_ANALYTICS_SPEC.md).

## Setup

1. Open [Project settings](https://us.posthog.com/project/472860/settings) and copy the **Project API Key** (`phc_...`).
2. Either:

   **A. `.env` (preferred for Metro)**

   ```bash
   cp .env.example .env
   # set UNTIL_POSTHOG_API_KEY=phc_...
   # keep UNTIL_POSTHOG_DEV=1 for local builds
   ```

   Babel loads `.env` via `dotenv` and inlines `UNTIL_POSTHOG_*` into the JS bundle.

   **B. Local override file**

   ```bash
   cp src/config/analytics.ts.example src/config/analytics.local.ts
   ```

   Set `POSTHOG_API_KEY` and keep `POSTHOG_DEV_ENABLED = true`.

3. Restart Metro with a clean cache (`yarn start --reset-cache`), then rebuild.

4. Confirm: Metro/device logs `[PostHog] enabled → …`, and events appear in PostHog → **Activity**.

## Lifecycle

`captureAppLifecycleEvents` is **enabled** in [`posthogClient.ts`](../src/services/posthogClient.ts). PostHog auto-captures **Application Installed**, **Application Opened**, etc. Manual `app_open` is still logged for Firebase parity.

## Payments

Android purchases use **Google Play Billing** (`react-native-iap`), not RevenueCat. Purchase events include `payment_provider: 'google_play'`.

## Events (high value)

| Event | When | Key properties |
|-------|------|----------------|
| `screen_view` | Navigation (auth + main stack) | `screen` |
| `onboarding_step` | Carousel step | `step`, `step_name` |
| `onboarding_complete` | User reaches Home | `exit_type`, `step`, `step_name` |
| `premium_viewed` | Paywall shown | `source` |
| `premium_purchase_started` | User taps a plan | `plan_id`, `source`, `price_display` |
| `premium_purchase_completed` | Play purchase applied | `plan_id`, `source`, `price_display`, `payment_provider` |
| `premium_purchase_failed` / `cancelled` | Billing errors | `error_code`, `error_message`, `payment_provider` |
| `trial_preview_started` | First in-app preview start | `trial_days`, `source` |
| `trial_preview_ended` | Preview ended | `converted` (0 or 1), `plan_id` (if converted) |
| `countdown_created` / `countdown_completed` | Deadline set / target day | `days_until`, `days_used`, `countdown_id` |
| `share_tapped` / `share_completed` | Share snapshot | `source_screen`, `share_type`, `focus`, `method` |
| `notification_permission_result` | Notifee permission prompt | `granted`, `source` |
| `feature_coach_*` / `share_prompt_*` | Engagement modals | `target`, `dismiss_reason` |
| `task_completed` | Daily task marked done | — |
| `life_progress_viewed` | Life screen opened | — |

See [`FIREBASE_ANALYTICS.md`](./FIREBASE_ANALYTICS.md) for widget / onboarding events (dual-written).

## Dashboards (create in PostHog)

1. **Acquisition** — Application Installed → `onboarding_complete` → `widget_add_tapped` → D7 retention  
2. **Monetization** — `premium_viewed` → `premium_purchase_started` → `premium_purchase_completed` (breakdown: `source`, `plan_id`)  
3. **Retention** — D1/D7 by cohort: widget users vs non-widget  

## Dev

- Without a Project API Key, PostHog is disabled; look for `[PostHog] disabled` in Metro logs. Firebase still works when `google-services.json` is present.
- In `__DEV__`, you also need `UNTIL_POSTHOG_DEV=1` or `POSTHOG_DEV_ENABLED = true` (both are set in the examples).
- After changing `.env` or `analytics.local.ts`, restart Metro with `--reset-cache`.

## Privacy

Website privacy policy (`website/src/domain/legal/privacy.ts`) discloses PostHog and Firebase Analytics. Redeploy the site after policy updates.
