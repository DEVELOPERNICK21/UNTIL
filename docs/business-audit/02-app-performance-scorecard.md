# 02 · Current app performance scorecard (product, funnel, technical)

Date 2026-11-04. Grades are mine: **A** ready, **B** good with gaps, **C** works but leaks value, **D** weak, **F** broken or absent, **?** cannot grade without data. Tags as in the [README](README.md#how-claims-are-labelled).

## 1. Scorecard

| Area | Grade | Evidence | Biggest gap |
|------|:----:|----------|-------------|
| Concept and emotional pull | B | Life-in-weeks / days-left framing with a calm tone and a companion ("Ember") `[CODE]` | Core mechanic is a commodity (see [08](08-competitor-analysis.md)); differentiation not shown on store pages `[MISSING]` |
| Free / Premium design | C | Day and Year free, Month/Life/overlay/Dynamic Island/lost-time alerts Premium `[CODE]` `premium.ts`, `widgetGating.ts` | Month is a weak paid reason; no customization pillar; the two gating files disagree on Daily Tasks (`premium.ts:21` lists it, `widgetGating.ts:2` does not) |
| Onboarding / activation | C | 14 funnel steps + paywall + account prompt before Home `[CODE]` `quizFunnel.ts:13`, `AuthNavigator.tsx`; 153 completions from 464 first opens (33%) `[DATA]` | Length, a fixed 2.6 s fake loader `[CODE]` `OnboardingScreen.tsx:142`, step-level drop-off unknown `[MISSING]` |
| First-run widget setup | B- | Android one-tap pin offered in onboarding and after `[CODE]`; 71 `widget_add_tapped` ≈ 15% of installs `[DATA]` (pre-pin) | iOS has no equivalent; no confirmation that a widget actually exists on the home screen on iOS |
| Paywall and purchase | F | 79% of purchase attempts failed `[DATA]`; INR strings shown to all `[CODE]`; stacked paywall risk `[CODE]`; main paywall is a RevenueCat dashboard design I cannot see `[MISSING]` | Everything in [03](03-revenue-and-monetization-audit.md) and [05](05-conversion-optimization-plan.md) |
| Retention | D | D1 11.6%, D7 3.5%, D14 1.1% `[DATA]` vs lifestyle/productivity medians ~24/10/5% (D1/D7/D30) `[BENCH]` | Reminders off by default; no value event that brings people back besides widgets |
| Engagement mechanics | B- | Streak (presence), 18 badges, daily reflection, quests, lost-time card, share prompts `[CODE]` | Built but not measured: no retention cut by "has a widget" or "has reminders" `[MISSING]` |
| Stability | F (reported) | Crash-free users 37–39% on 1.3; 2,647 crash events over 1,139 sessions `[DATA]` | Traces not seen `[MISSING]`; one concrete suspect found below |
| Code quality and architecture | A- | Layered features, dependency table, ownership and architecture tests, 98 test entries `[CODE]` | Docs lag the code (see [README](README.md#documentation-drift-found-along-the-way)) |
| Analytics instrumentation | B- | ~105 event names, Firebase + PostHog, consent gate `[CODE]` | Missing funnel pieces in [04](04-analytics-tracking-plan.md); custom dimensions probably unregistered `[MISSING]` |
| Attribution | D | Tag helpers exist; website Play buttons untagged; iOS cannot attribute `[CODE]`; every user "Direct" `[DATA]` | One 10-minute fix for the site; iOS needs campaign links or Apple Search Ads attribution |
| ASO | ? | Intended Play copy exists in `docs/PLAY_STORE_ASO.md` `[CODE]`; live listing, ratings, reviews, conversion unseen `[MISSING]` | See [07](07-aso-strategy.md) |
| Localization (in-app) | B+ | 11 languages, parity-tested `[CODE]` | No native review; store listings not localized `[MISSING]`; widgets/watch still English `[CODE]` `docs/LOCALIZATION.md` |
| Backend and security | C+ | Firebase Auth/Firestore, Vercel KV trial endpoint, owner-only rules `[CODE]` | Entitlement self-writable; device cap client-side; trial endpoint unauthenticated by design `[CODE]` |
| Trust and legal | C | Terms/Privacy pages exist; subscription disclosure under the CTA `[CODE]`; analytics on unless the user declines `[CODE]` `analyticsConsent.ts` | Dead support email; privacy default on for EU users may need a consent prompt (legal review, not advice) |
| Wearables and desktop | B | Wear OS Time Hub (versionCode 21, minSdk 30), Apple Watch (watchOS 10), Tauri desktop 0.1.3 `[CODE]` | Strategic value unproven; each is a separate store review and support surface |

Overall: engineering **A-**, business **D**. The gap between those two is the finding.

## 2. Technical performance and stability audit

For each item: what the code says, what to measure, a target. Targets are `[ASSUME]` unless a source is given; Play and Apple publish "bad behaviour" thresholds (user-perceived crash rate 1.09% and ANR 0.47% overall `[BENCH: Google Play Android vitals, verify current values]`).

| Item | What the code shows `[CODE]` | How to measure | Target |
|------|------------------------------|----------------|--------|
| **Startup time** | Fixed 1.0 s splash before UI (`App.tsx:105`), then a navigation container and 14-step onboarding on first run; Hermes on, New Architecture on `gradle.properties` | Play Console → Android vitals → Startup time; Xcode Organizer → Launch time; add a `cold_start_ms` event (JS start to first interactive) | Cold start <2 s on a mid-range Android; no deliberate delay once launch is done (cut the splash to the native splash only) |
| **Crash-free sessions** | Crashlytics wired, JS error boundary, non-fatal logging; collection only if `google-services.json` is present at build (`build.gradle` guards the plugin) | Firebase Crashlytics, Play vitals | Crash-free users >99%, user-perceived crash rate <1% |
| **Foreground-service crash risk (new finding)** | `UNTILOverlayService` is a foreground service of type `dataSync` (`AndroidManifest.xml:162-165`) on targetSdk 36 and has **no `onTimeout` handler**. Android 15+ stops a `dataSync` service after 6 hours in 24 hours and expects `stopSelf()` in seconds, otherwise the app crashes `[BENCH: Android developer docs]`. The overlay is an ambient, all-day feature | Look for "dataSync foreground service did not stop within its timeout" in the Crashlytics traces (A7). Hypothesis, not confirmed | Handle `onTimeout` (stop, show a notification to restart), or change the type (a special-use declaration) and re-declare in Play Console |
| **Release-only crashes** | R8 minify + resource shrink on (`build.gradle:142-143`); `proguard-rules.pro` keeps React/Hermes/MMKV/WorkManager only; mapping file is bundled (63 MB `proguard.map` in the AAB) | Check Crashlytics shows de-obfuscated traces; run a release build through the pre-launch report | Zero "ClassNotFound / NoSuchMethod" crashes |
| **Memory** | Skia (`librnskia.so` 7–12 MB per ABI), bitmap-drawn widgets in `UNTILWidgetWorker.kt` (dots and ember bitmaps) | Android Studio profiler on a 3 GB device; Play vitals does not report memory | No `OutOfMemoryError` in Crashlytics; widgets render <50 ms |
| **Battery** | Widget worker every 15 minutes (the WorkManager minimum) plus a one-time tick worker; overlay foreground service; Wear sync | Play vitals → Excessive wakeups, Stuck wake locks; Android battery stats | Below Play's "bad behaviour" thresholds |
| **Widget refresh reliability** | `PeriodicWorkRequest` 15 min with `ExistingPeriodicWorkPolicy.KEEP`, boot receiver, one-time day ticks `[CODE]`. WorkManager is subject to Doze and to manufacturer battery managers (Xiaomi, Oppo, Vivo, Realme), which matter because India is about half of active users `[DATA]` | Add a `widget_staleness_hours` event on each app open (now minus the last widget write); in Firebase compare by manufacturer | Widget data never older than 1 hour on supported devices; show a "tap to refresh" hint after 3 hours stale |
| **Background tasks** | WorkManager for widgets; Notifee for reminders; no exact-alarm permission in the manifest, and no `alarmManager` option set in `src` | Time the first reminder after install on 3 devices (Pixel, Samsung, Xiaomi) | Reminder within ±2 minutes of the chosen time on 90% of devices, or the copy says "around 8 am" |
| **Notification reliability** | Local-only scheduling, rescheduled on app open; reminders stop after 14 days away by design (`WIN_BACK_GIVE_UP_AFTER_DAYS`) `[CODE]` | `notification_permission_result` and a new `notification_delivered` / opened event | Opt-in >25% of those asked `[ASSUME]` |
| **API latency** | Only one first-party endpoint, `/api/trial-preview` on Vercel + KV, plus Firebase and RevenueCat; no timeout set on `fetch` `[CODE]` | Vercel function logs; add client timing in the event | p95 <800 ms; never blocks the UI (it does not: it is fire-and-forget) |
| **App size** | Last local release AAB (2026-10-21): 111 MB file, 4 ABIs including x86 and x86_64, a 63 MB mapping file and native debug symbols (neither reaches devices) `[CODE]` local artifact, not necessarily what is live. Per-device download size is `[MISSING]` | Play Console → Release → App bundle explorer (download size per device) | <40 MB download on arm64 `[ASSUME]`; worth checking because many users are on low-storage devices |
| **Android compatibility** | minSdk 24, target/compile 36, 16 KB page-size workaround noted in `build.gradle` `[CODE]`; versionName 1.3 / code 34 | Play Console → Device catalog and Pre-launch report | No device group >2× the average crash rate |
| **iOS compatibility** | App deployment target 15.1, **widgets and Live Activity extension 17.0**, watch app 10.0 (`project.pbxproj`) `[CODE]` | App Store Connect → iOS version share | Users on iOS 15–16 install the app but cannot add widgets, the core promise; decide whether to raise the app's minimum or message it |
| **Wear OS** | Time Hub minSdk 30 (Wear OS 3+), versionName 1.1 / code 21, synced by the phone's widget worker `[CODE]` | Play vitals for the Wear form factor | Crash-free >99%, sync freshness event |
| **Subscription restoration** | Restore button on the paywall, `RestorePurchasesUseCase`, success logs `premium_restore_completed` `[CODE]`; no event for "nothing to restore" or a restore failure | Add `premium_restore_failed` / `premium_restore_empty` | Restore success measured per cohort |
| **Purchase failures** | Failure logs `error_code` (RevenueCat readable code) and trimmed message; the raw message is shown to the user in an alert `[CODE]` `PremiumPaywallBody.tsx` | Group `premium_purchase_failed` by `error_code`; compare to RevenueCat's 3xx codes | Purchase success (completed ÷ started) >70% `[ASSUME]` |

## 3. Measurable technical improvements

| Improvement | Metric | Effort |
|-------------|--------|--------|
| Handle `onTimeout` in `UNTILOverlayService` (or change its service type) | Zero dataSync-timeout crashes; overlay on-time per day | Low–Medium |
| Remove the 1 s splash delay and the 2.6 s fake loader; keep the native splash only | Cold start p50 and p90; onboarding completion | Low |
| Widget staleness event plus an in-app "widget may be paused by battery saver" hint with a deep link to the OEM setting | Median staleness hours; D7 retention among widget users | Medium |
| Exact-alarm or foreground-window option for the morning reminder | Delivery latency | Low–Medium |
| Slim the Android build: drop `x86` and `x86_64` from `reactNativeArchitectures` for release (emulator-only ABIs) | AAB size; per-device size unchanged but build faster | Low |
| Decide the minimum iOS version (17 for widgets) or add an in-app notice | Share of installs that cannot show a widget | Low |

Presented here for approval; no change has been made.
