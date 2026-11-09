# UNTIL business audit — index (2026-11-04)

Audit of UNTIL as a subscription business: revenue, analytics, conversion, retention, ASO, competitors, a revenue model and a 90-day plan. **The audit itself changed no code.** Code changes are shown as a patch and approved first; so far one has been applied (proposal #1, 2026-11-05). The only files besides markdown are [revenue-model-calc.py](revenue-model-calc.py), a stand-alone calculator that reproduces every number in document 09 (standard library only, not part of the app), and [proposals/code-proposal-1.patch](proposals/code-proposal-1.patch), the first code change, applied on 2026-11-05 after approval. Other code changes in these documents remain proposals.

## The deliverables

| # | Document | What it answers |
|---|----------|-----------------|
| 01 | [Executive business audit](01-executive-business-audit.md) | Where the business stands, the five things that matter, what to stop doing |
| 02 | [App performance scorecard](02-app-performance-scorecard.md) | Graded scorecard: product, funnel, tech, analytics, ASO, with evidence |
| 03 | [Revenue and monetization audit](03-revenue-and-monetization-audit.md) | Free vs Premium, pricing, trial, lifetime, weekly, regional pricing, pricing experiments |
| 04 | [Analytics tracking plan](04-analytics-tracking-plan.md) | Every metric: meaning, formula, source, target; what the code tracks and what is missing |
| 05 | [Conversion optimization plan](05-conversion-optimization-plan.md) | Journey friction, fixes, three or more paywall experiments |
| 06 | [Retention strategy](06-retention-strategy.md) | Reminders, summaries, milestones, streaks (and which to skip) |
| 07 | [ASO strategy](07-aso-strategy.md) | Listing audit, keywords, screenshots, localization, review strategy |
| 08 | [Competitor analysis](08-competitor-analysis.md) | 12 competitors with sourced pricing, gaps for UNTIL |
| 09 | [Revenue projection model](09-revenue-projection-model.md) | Three scenarios, sensitivity, what has to be true |
| 10 | [90-day execution roadmap](10-90-day-execution-roadmap.md) | Week-by-week tasks with outcome, priority, effort, dependencies, metric; includes a 40-experiment backlog |
| — | [Data requests](DATA_REQUESTS.md) | The exact exports needed from RevenueCat, Firebase, App Store Connect, Google Play, PostHog |
| — | [Code proposal #2](proposals/code-proposal-2.md) | Sessions instead of foregrounds for gating, Firebase user properties, widget and notification telemetry, PostHog alias, Android overlay timeout. **Not applied** (two patches, app and Android). |
| — | [Code proposal #1](proposals/code-proposal-1.md) | The first code changes (paywall prices, one paywall, funnel events). **Applied 2026-11-05**, not yet run on a device. |

## How claims are labelled

Every material claim carries one of these tags. Where a claim has none, it is a recommendation, and recommendations are hypotheses until an experiment says otherwise.

| Tag | Meaning |
|-----|---------|
| `[CODE]` | Verified in this repository on 2026-11-04. A file (and line) is given when it helps. |
| `[DATA]` | A number reported in [REVENUE_AUDIT_2026-10-21.md](../REVENUE_AUDIT_2026-10-21.md), taken from a Firebase Analytics export (2026-07-18 to 2026-10-15). I have not seen the raw export, and it predates the last two weeks of code changes. Treat as reported, not audited. |
| `[BENCH]` | A published figure from outside UNTIL (reports, store pages, third-party trackers). Source linked, snapshot date implied by this audit. Third-party aggregators are often stale or wrong; verify before relying. |
| `[ASSUME]` | My modelling or judgement input. Not measured. |
| `[MISSING]` | Data that does not exist in the repo or the earlier audit; the export that fills it is in [DATA_REQUESTS.md](DATA_REQUESTS.md). |

No performance, revenue or user-behaviour number in these documents is invented. Where a number is not `[CODE]`, `[DATA]` or `[BENCH]`, it is tagged `[ASSUME]`.

## What I could not see

- RevenueCat, App Store Connect, Google Play Console, Firebase Console and PostHog (no access). Everything console-side (product status, regional prices, offerings, paywall design in the RevenueCat dashboard, Crashlytics traces, store listing text, ratings, reviews) is `[MISSING]`.
- Whether a build newer than Android 1.3 (versionCode 34, `android/app/build.gradle:107-110`) has shipped. The code on disk has fixes the 2026-10-21 audit asked for, so the Firebase numbers in this audit describe the app *before* them.
- Whether the iOS app is live. The website still says "iOS coming soon" and `IOS_APP_STORE_ID` is empty (`src/config/storeUrls.ts:13`, `website/src/domain/config.ts:37`), but the app went through App Review in September (docs/APP_STORE_RESOLUTION_*) and the Xcode project is at build 14. `[MISSING]`
- Competitor data comes from public store pages and aggregators fetched on 2026-11-04. Prices vary by country and change; each row says where it came from.

## Status of the 2026-10-21 audit's findings in the code today

The previous audit (same codebase, a Firebase export) ranked the levers. This table is what changed in the repository since, so work is not repeated.

| 2026-10-21 finding | Status in code today | Tag |
|--------------------|----------------------|-----|
| Purchases fail (61 of 77 attempts) | Failure now logs RevenueCat's readable error code (`purchasesErrors.ts`, `purchaseErrorCode`). The cause is console configuration; nothing in code can confirm it is fixed. | `[CODE]` + `[MISSING]` |
| Android crashes (crash-free users 37–39% on 1.3) | No evidence of a fix: versionName is still 1.3, versionCode 34. Crashlytics traces not provided. | `[CODE]` + `[MISSING]` |
| Reminders off by default | Still `DEFAULT_ENABLED = false` (`retentionNotifications.ts:21`). **But** a value-first opt-in sheet now exists (after 5 opens, max 2 asks, `reminderOptIn.ts`), the quiz answer "check-ins" enables reminders (`useOnboardingFunnel.ts:73`), iOS is supported for opted-in features, and a win-back line starts after 3 days away (`WIN_BACK_AFTER_DAYS = 3`). | `[CODE]` |
| Widgets added by hand | Android one-tap pin is built (`WidgetBridgeModule.kt:100`, `usePinWidget`, `OnboardingPinWidget.tsx`). iOS has no equivalent. | `[CODE]` |
| No attribution | Campaign-tag helpers exist (`storeUrls.ts`), share links are tagged. The website's Play buttons are still untagged (`website/src/app/(marketing)/page.tsx:101,377`). | `[CODE]` |
| `until-app.com` has no DNS | Share links no longer use it (they use the Vercel site). **`support@until-app.com` is still the contact address on the website** (`website/src/domain/config.ts:23`) and `host until-app.com` returns NXDOMAIN today. | `[CODE]` |
| Share image has no QR / link | Not added. The caption carries a tagged link; the image does not. | `[CODE]` |
| `LoginScreen.tsx` dead file | Deleted. | `[CODE]` |
| License-key flow does nothing | No screen references it any more; the adapter and use case remain and answer "not available" when `UNTIL_LICENSE_API` is unset. Harmless dead code. | `[CODE]` |
| Weekly plan ₹49 | Unchanged; still a paywall card. | `[CODE]` |
| 5-day no-card preview | Unchanged (`MONETIZATION_TRIAL_DAYS = 5`). | `[CODE]` |
| Review prompt not tied to a good moment | Unchanged: 5 foreground opens and 3 days, or a finished countdown; no crash gate. | `[CODE]` |
| Onboarding 14 steps | Unchanged, plus a paywall and an account prompt before Home. | `[CODE]` |
| Premium spoofing via Firestore | Unchanged: any subcollection write is allowed for the owner (`firestore.rules`, `match /{collection}/{rest=**}`). | `[CODE]` |
| Per-country prices | Console setting; cannot see. The code still shows INR-formatted marketing strings to everyone (new finding in 03). | `[MISSING]` |

## Documentation drift found along the way

Several repo docs describe code that no longer exists, which will mislead anyone who plans from them:

- `docs/POSTHOG_ANALYTICS.md` and `docs/FIREBASE_ANALYTICS.md` point to `src/services/analytics.ts` (now `src/shared/analytics/analytics.ts`) and a 3-step carousel event `onboarding_step` that is declared but never fired.
- `docs/SUBSCRIPTION.md` lists Counter, Countdown, Daily Tasks and Hour Calculation as Premium; `features/premium/domain/premium.ts` says Counter, Countdown and Hour Calculation are "coming soon" (V2) and only Month, Life and Daily Tasks are Premium; the website and Android manifest ship counter, countdown and hour widgets.
- `docs/MONETIZATION_SETUP.md` says trial reminders fire on days 10, 13, 14; the code fires on days 3, 4, 5 (`TRIAL_REMINDER_DAYS`, `monetization.ts:40`).
- `docs/PLAY_STORE_GROWTH_CHECKLIST.md` assumes ~30–50 installs a month; the earlier audit measured ~155.
