# 04 · Analytics tracking implementation plan

Date 2026-11-04. Tags: `[CODE]` `[DATA]` `[BENCH]` `[ASSUME]` `[MISSING]` ([legend](README.md#how-claims-are-labelled)). **Targets are for "an app at our stage"** (about 150 installs a month, Android first, India-heavy `[DATA]`): they are starting points, not promises. No actual performance number appears here that is not tagged `[DATA]`.

## 1. What is instrumented today `[CODE]`

| Layer | What exists | Where |
|-------|-------------|-------|
| Event pipe | `logAnalyticsEvent` writes each event to **Firebase Analytics and PostHog**, ~105 typed event names; typed union prevents typos | `src/shared/analytics/analytics.ts` |
| Consent | On unless the user declines; off for known under-13; session replay off | `analyticsConsent.ts`, `config/analytics.ts` |
| Crash | Crashlytics, error boundary, breadcrumbs, user id = device id or uid | `analytics.ts`, `CrashErrorBoundary.tsx` |
| Person data | PostHog person properties: `is_premium`, `trial_active`, `trial_days_remaining`, `app_open_count`, `onboarding_complete`, `platform`, `app_version` | `analyticsUserProperties.ts` |
| Funnel | `onboarding_step_view{step, step_index, step_count}`, `onboarding_answer`, `onboarding_results_view`, `onboarding_paywall_seen/result/skipped`, `premium_viewed{source}`, `premium_purchase_started/completed/failed/cancelled{plan_id, source, price_display, error_code}`, `premium_restore_completed`, `trial_preview_started/ended{converted}`, `widget_add_tapped`, `widget_pin_requested/confirmed`, `share_*`, `reminder_optin_*`, `notification_permission_result`, `review_requested`, account sign-in events | various |
| Screen views | `screen_view{screen}` on navigation | `useNavigationAnalytics.ts` |

## 2. What is wrong or missing (ranked by what blocks decisions)

| # | Problem | Why it matters | Fix (proposal, not applied) | Effort |
|---|---------|----------------|-----------------------------|--------|
| 1 | **Event parameters probably not registered as GA4 custom dimensions.** Firebase reports only break events down by registered parameters. The earlier audit could not split failures by plan or error code `[DATA]` | The 61 purchase failures cannot be explained from the console | Register `step`, `plan_id`, `source`, `error_code`, `result`, `focus`, `value` as custom dimensions; turn on the BigQuery export | Console only |
| 2 | **No numeric revenue on purchase events**: only `price_display` (a string) `[CODE]` `PremiumPaywallBody.tsx` | Firebase cannot compute revenue or ARPU; GA4's `purchase`/`value` semantics unavailable | Add numeric `value` and `currency` from the store product to `premium_purchase_completed`; better, enable the RevenueCat → Firebase and RevenueCat → PostHog integrations so renewals, cancellations, billing issues and refunds arrive server-side with revenue | Low (code) + console |
| 3 | **No Firebase user properties or user id** (`setUserProperty` / `setUserId` for Analytics absent; only PostHog and Crashlytics get them) `[CODE]` | In Firebase you cannot split retention by premium, widget owner, language or platform | Set GA4 user properties once per launch: `is_premium`, `has_widget`, `widget_count`, `app_language`, `reminders_on`, `onboarding_goal` | Low |
| 4 | **PostHog identity switch**: distinct id is the device id, then the account uid after sign-in; `identify(uid)` does not alias the earlier anonymous id `[CODE]` `useAnalyticsBootstrap.ts` | One person becomes two in funnels and retention | Call PostHog `alias` / use the same stable id (the device id) as `distinct_id` and set uid as a property | Low |
| 5 | **Two systems, one dashboard**: PostHog is built and has five insights `[CODE]` `posthog-setup-report.md`, but whether production builds carry the PostHog key is unknown (`UNTIL_POSTHOG_API_KEY` comes from CI secrets `[CODE]` `codemagic.yaml`) | Double instrumentation with one system unread | Pick **one source of truth for product analytics (PostHog) and one for revenue (RevenueCat)**; keep Firebase for Crashlytics, Play/First-open attribution and Google's audiences | Decision |
| 6 | **Missing funnel events** (below, section 4) | Cannot measure the paywall, the widget, or the notification as steps | Add 9 events | Low–Medium |
| 7 | **Declared but never fired**: `onboarding_step` (docs still describe it), source name `widget_gate` `[CODE]` | Docs and dashboards built on them will be empty | Remove from the type union and docs | Trivial |
| 8 | **`premium_viewed` for the RevenueCat paywall fires before it is presented** (`OnboardingPaywallScreen.tsx:70-72`, `DeferredPaywallModal.tsx`) | Counts "intended" not "shown"; the earlier audit saw 551 premium views vs 367 onboarding paywalls with a known double-count bug `[DATA]` | Log `paywall_shown` only when the paywall really was presented. The SDK's `presentPaywall` resolves only when the paywall closes and has no "on screen" callback, so for the RevenueCat paywall the event can be logged at close (accurate counts, not accurate timing); use RevenueCat's own paywall impression charts as the cross-check | Low |
| 9 | **`app_open` fires per foreground, not per session** and the open counter (`appOpenCount`) is the same (`App.tsx:204`) | Inflates "opens" used for the 24 h Life unlock, the reminder opt-in (5), the review prompt (5), and the deferred paywall (2) | Count sessions (new session after 30 min background) for gating; keep foreground count only as telemetry | Low |
| 10 | **Analytics on by default for everyone** `[CODE]` | Possible GDPR issue for EU users (Germany had 14 active users `[DATA]`) | Legal review; an EU-only consent sheet if required | Low |

## 3. Metric catalogue

Legend for **Source**: FB = Firebase Analytics, PH = PostHog, RC = RevenueCat, GP = Google Play Console, AS = App Store Connect. **Built?** = can it be computed today from the code's events.

### Acquisition

| Metric | What it means and why it matters | Formula | Source | Target at this stage | Built? |
|--------|-----------------------------------|---------|--------|----------------------|--------|
| Total downloads | New installs; the top of every funnel | Count of installs/acquisitions in the store | GP *Statistics → Installs*; AS *Analytics → Downloads* | Not a target; trend up month on month | Store-side |
| Store listing conversion | Share of listing visitors who install; tells you if the page sells | Store listing acquisitions ÷ store listing visitors | GP *Store performance* (with peer percentile); AS *Analytics → Conversion Rate* | At or above the peer median in the console `[BENCH]` (third-party medians cluster 20–40% but vary widely) | Store-side |
| Organic installs | Installs without paid or tagged referral | Installs with source = search/explore/direct ÷ installs | GP *Acquisition channels*; FB *First user source* | 100% today (nothing paid) | Partly (UTM) |
| Paid installs, CPI | Cost to buy an install | Spend ÷ paid installs | Ad network + GP | **No target. Do not buy installs now**: model net value per install is about $0.17–0.33 over 24 months `[ASSUME]` ([09](09-revenue-projection-model.md)), far below any real CPI | n/a |
| Acquisition source | Which channel brings users who pay | `utm_source/medium/campaign` carried by the Play referrer | FB *User acquisition*; PH `$initial_utm_*` | Every link tagged; "Direct" under 30% | Android: yes if links tagged |
| First opens ÷ installs | Installs that actually open | `first_open` ÷ store installs | FB + GP | >50% was the repo's own bar (`PLAY_STORE_GROWTH_CHECKLIST.md`); >70% healthy `[ASSUME]` | Yes |

### Engagement

| Metric | Meaning and why | Formula | Source | Target | Built? |
|--------|-----------------|---------|--------|--------|--------|
| DAU, WAU, MAU | Active people; the base for everything | Distinct active users in 1, 7, 28–30 days | FB *Active users*; PH | Growth, not a level | Yes |
| DAU/MAU (stickiness) | How habitual; for a widget app a high number means the app is opened, not that the widget works | DAU ÷ MAU | FB, PH | 5–6% now `[DATA]`; 12–15% a first goal `[ASSUME]` | Yes |
| Session frequency / duration | Opens per user per week; seconds per open. For a glance app, short is fine | `session_start` per active user per week; FB *User engagement* | FB | ≥3 opens a week among widget owners `[ASSUME]` | Yes (foreground count is inflated, see gap 9) |
| **Widget installed (activation)** | The best leading indicator of retention for this product: a widget on the home screen means a daily impression | Share of new users with ≥1 widget on the home screen by day 1 | `widget_pin_confirmed` (Android one-tap), plus **new** `widget_count` user property | 15% of installs tapped "add widget" before one-tap pin `[DATA]`; 35–40% a first goal `[ASSUME]` | Partly (iOS cannot be detected by the app) |
| Widget configuration | Depth of use: type, accent, size | `widget_types`, customization saves | PH | Report only | **Missing** |
| Feature adoption | Which surfaces are used: Life, tasks, countdowns, counters, share, overlay, island | Users with ≥1 event ÷ active users, per feature | PH from `life_progress_viewed`, `task_added`, `countdown_created`, `share_completed`, `intervention_*`, badge events | Report only; kill features under ~3% adoption after 90 days `[ASSUME]` | Yes |
| Notification engagement | Opt-in and open rates | granted ÷ asked; opened ÷ delivered | `notification_permission_result`, `reminder_optin_*`; **new** `notification_opened` | Opt-in >25% of those asked `[ASSUME]` | Opt-in yes; opens **missing** |
| Onboarding completion | Share who reach Home | `onboarding_complete` ÷ first opens | PH funnel on `onboarding_step_view` | 33% now `[DATA]`; 55–60% first goal `[ASSUME]` | Yes |

### Monetization

| Metric | Meaning and why | Formula | Source | Target | Built? |
|--------|-----------------|---------|--------|--------|--------|
| Paywall impressions | Opportunities to sell | Presented paywalls | RC *Paywalls* dashboard (RevenueCat paywall); `premium_viewed` (custom, unreliable: gap 8) | Report | Partly |
| Paywall conversion | Views that end in a purchase | Purchases ÷ paywall views | RC + PH | 1–3% `[ASSUME]` | Partly |
| Purchase success rate | Attempts that complete; the broken metric today | `premium_purchase_completed` ÷ `premium_purchase_started` | PH/FB | **5% today** `[DATA]`; >70% `[ASSUME]` | Yes |
| Free-to-paid | Installs that pay within a window | Payers within 35 days ÷ installs | RC *Initial conversion* | Median 2.1% for freemium apps `[BENCH: RevenueCat 2026]`; 0.5% a pragmatic floor `[ASSUME]` | RC |
| Trial-to-paid | Trial starts that convert (no store trial today; the 5-day preview is not a store trial) | Paid ÷ trial starts | RC *Trial conversion* | 25–40% depending on length `[BENCH]` | **n/a today** |
| MRR / ARR | Normalized recurring revenue; excludes lifetime | Sum of monthly-equivalent active subscriptions | RC *Overview* | Report | RC |
| ARPPU | Revenue per paying user | Revenue ÷ payers | RC | Rises with country pricing | RC |
| ARPU | Revenue per active user | Revenue ÷ MAU | RC + FB | Report | RC |
| LTV | Net revenue per payer over a horizon | Σ net revenue per payer ÷ payers (24 months) | RC *LTV* chart | Model: $6–13 per payer `[ASSUME]` | RC |
| Net revenue per install | The one number that decides what acquisition you can afford | Net revenue from a cohort ÷ cohort installs | RC + store installs | Median $0.38 at day 60 for freemium apps `[BENCH]` | Derived |
| Refund rate | Refunded ÷ gross | Refunds ÷ sales | RC; GP/AS financial reports | Under 5% `[ASSUME]`; flag weekly plan separately | RC |
| Involuntary churn | Failed-payment cancellations | RC *Billing issues*; Play *account hold* | RC, GP | Google: 31% of cancellations, App Store 14% `[BENCH]` | RC |

### Retention

| Metric | Meaning and why | Formula | Source | Target | Built? |
|--------|-----------------|---------|--------|--------|--------|
| D1, D7, D30 retention | Share of a cohort active on day N | Users active on day N ÷ users who installed on day 0 | FB *Retention*; PH; GP; AS | 11.6 / 3.5 / ~1 (D14) `[DATA]` → 24 / 10 / 5 `[BENCH: MWM lifestyle US Q3 2025]` | Yes |
| WAU retention by cohort | Week-over-week stability | Active in week N ÷ cohort size | PH | Report | Yes |
| Retention by activation | The key diagnostic: does a widget or a reminder lift D7? | D7 for users with `has_widget` vs without | PH after gaps 3 and 6 | Widget owners ≥2× non-owners `[ASSUME]` | **Needs gap fixes** |
| Subscription renewal rate | Subscribers who stay | Renewals ÷ expected renewals | RC *Subscription retention* | Yearly first renewal ~28% `[BENCH]` | RC |
| Monthly churn (subscribers) | Share of monthly subscribers lost each month | Cancelled ÷ active at start | RC *Churn* | Report; modelled at 1 ÷ average months paid | RC |

## 4. Proposed new events (for approval before coding)

| Event | Params | Fire when | Replaces / fixes |
|-------|--------|-----------|------------------|
| `paywall_shown` | `surface` (onboarding, deferred, settings, widget_gate, life_ended, trial_ending), `variant`, `platform` | The paywall was actually presented (custom paywall: on mount; RevenueCat paywall: logged when it closes, since the SDK has no on-screen callback) | Gap 8 |
| `paywall_plan_selected` | `plan_id`, `surface` | A plan card is tapped on the custom paywall | New |
| `paywall_dismissed` | `surface`, `seconds_open`, `method` | Custom paywall closed without purchase | New |
| `premium_purchase_completed` (extend) | add `value`, `currency`, `period`, `is_trial` | Purchase succeeded | Gap 2 |
| `premium_restore_failed` / `premium_restore_empty` | `source` | Restore returns nothing or errors | Missing |
| `widget_inventory` | `widget_count`, `widget_types` (comma list), `platform` | App open (Android via `AppWidgetManager`; iOS via `WidgetCenter.getCurrentConfigurations`, best effort) and as GA4 user properties | The activation metric |
| `widget_stale` | `hours_stale`, `manufacturer` | App open when the widget cache is older than 3 h | Widget reliability |
| `notification_opened` | `type` (retention, winback, task, streak, trial) | Notifee press event | Notification engagement |
| `session_start_app` | `session_index`, `days_since_install` | New session after 30 min in background | Gap 9 |

Also set Firebase user properties (gap 3) and RevenueCat subscriber attributes (`$firebaseAppInstanceId`, `$posthogUserId`, `$mediaSource`, `$campaign` from the Play install referrer) so RevenueCat's server-side events can be joined to product events.

## 5. Implementation order

| Step | Do | Owner | Needs |
|------|----|-------|-------|
| 1 (day 1) | Register custom dimensions; turn on the BigQuery export; check RevenueCat → PostHog and → Firebase integrations | You (consoles) | — |
| 2 (day 1–2) | Pull the exports in [DATA_REQUESTS](DATA_REQUESTS.md) A and B | You | — |
| 3 (week 1) | Code proposal #1: `value`/`currency`, `paywall_shown`, `paywall_plan_selected`, `paywall_dismissed`, restore events; remove dead event names | Me, after your approval | Presented as a diff first |
| 4 (week 2) | Code proposal #2: `widget_inventory`, `widget_stale`, GA4 user properties, `session_start_app`, `notification_opened`; PostHog identity fix | Me, after approval | Native read of the widget list on Android |
| 5 (week 2) | Build the three dashboards below | Me/You | PostHog access |
| 6 (week 3 onward) | Weekly review; thresholds in [10](10-90-day-execution-roadmap.md) | You | — |

## 6. Dashboards to build

1. **Revenue (RevenueCat)**: MRR/ARR, new payers by product and country, trial and renewal, refunds, billing issues, net revenue per install.
2. **Funnel (PostHog)**: store visit → install → first open → onboarding steps → widget added → paywall shown → purchase started → completed; by country and language; Android and iOS separately.
3. **Retention and habit (PostHog)**: D1/D7/D30 for widget owners vs others, reminders on vs off, language; DAU/WAU/MAU; sessions per user; notification opt-in and open.
4. **Stability (Crashlytics + Play vitals)**: crash-free users and sessions per version; top five issues; ANR; startup.

## 7. Data-quality rules

- Count people, not events (the earlier audit's counts were events `[DATA]`).
- Never read a rate with fewer than 100 observations in the denominator; label it "directional".
- Reconcile weekly: RevenueCat revenue = store financial report ± refunds; app `premium_purchase_completed` count = RevenueCat new payers + renewals-excluded.
- The earlier audit lists 4 completed purchases but US$0.99 of revenue `[DATA]`; until RevenueCat A1 reconciles that, treat the purchase-completed counter as unverified.
