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

## Events (high value)

| Event | When |
|-------|------|
| `screen_view` | Navigation (auth + main stack) |
| `premium_viewed` | Premium screen / paywall shown |
| `premium_purchase_started` | User taps a plan |
| `premium_purchase_completed` | Play purchase applied |
| `premium_purchase_failed` / `cancelled` | Billing errors |
| `trial_preview_started` | First in-app preview start |
| `trial_preview_ended` | Preview expired without purchase |
| `share_tapped` | Share snapshot |
| `task_completed` | Daily task marked done |
| `life_progress_viewed` | Life screen opened |

See [`FIREBASE_ANALYTICS.md`](./FIREBASE_ANALYTICS.md) for onboarding / widget events (dual-written).

## Dashboards (create in PostHog)

1. **Acquisition** — `onboarding_complete` → `widget_add_tapped` → D7 `app_open` retention  
2. **Monetization** — `premium_viewed` → `premium_purchase_started` → `premium_purchase_completed` (breakdown: `source`, `plan_id`)  
3. **Retention** — D1/D7 by cohort: widget users vs non-widget  

## Dev

- Without `analytics.local.ts` key, PostHog is disabled; events log to console in `__DEV__`.
- Firebase events still send when `google-services.json` is present.

## Privacy

Website privacy policy (`website/src/domain/legal/privacy.ts`) discloses PostHog and Firebase Analytics. Redeploy the site after policy updates.
