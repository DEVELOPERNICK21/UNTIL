# PostHog Analytics

UNTIL sends product events to **PostHog** and **Firebase Analytics** via [`src/services/analytics.ts`](../src/services/analytics.ts). Crash reporting stays on **Firebase Crashlytics**.

Full implementation spec: [`POSTHOG_ANALYTICS_SPEC.md`](./POSTHOG_ANALYTICS_SPEC.md).

## Setup

1. Create a PostHog project at [us.posthog.com](https://us.posthog.com) and copy the **Project API Key** (`phc_...`).
2. Copy the example config and add your key:

   ```bash
   cp src/config/analytics.ts.example src/config/analytics.local.ts
   ```

3. Edit `src/config/analytics.local.ts`:

   ```ts
   export const POSTHOG_API_KEY = 'phc_your_key_here';
   export const POSTHOG_HOST = 'https://us.i.posthog.com';
   export const POSTHOG_DEV_ENABLED = true; // optional: test in __DEV__
   ```

4. Install native deps (iOS):

   ```bash
   yarn install
   cd ios && pod install && cd ..
   ```

5. Rebuild the app. In PostHog → **Activity**, confirm events appear.

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

- Without `analytics.local.ts` key, PostHog is disabled; events log to console in `__DEV__`.
- Firebase events still send when `google-services.json` is present.

## Privacy

Website privacy policy (`website/src/domain/legal/privacy.ts`) discloses PostHog and Firebase Analytics. Redeploy the site after policy updates.
