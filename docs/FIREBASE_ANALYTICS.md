# Firebase Analytics & Crashlytics

UNTIL logs product events via [`src/services/analytics.ts`](../src/services/analytics.ts). Events are sent to Firebase when native modules are installed and `google-services.json` is present. The same events are **dual-written to PostHog** when configured — see [`POSTHOG_ANALYTICS.md`](./POSTHOG_ANALYTICS.md).

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

Use `recordCrashError(error, context)` from `analytics.ts` in catch blocks for non-fatal reporting.

## Dev

Without Firebase config, events log to console in `__DEV__` only.
