# Revenue audit — 2026-10-21

Source: Firebase Analytics export for 2026-07-18 → 2026-10-15 (90 days, project `until-b7624`), the code on `main` at 95a74d9, and the docs in this folder. Numbers below are event counts from that export, not unique users, unless it says otherwise. Anything marked **estimate** is arithmetic on those numbers, not a promise.

## The short version

UNTIL made **US$0.99 in 90 days** (one purchase). The reason is not the price or the paywall copy. Four things stack on top of each other:

1. **Purchases fail.** 77 people started a purchase; 61 failed, 11 cancelled, 4 completed.
2. **The Android app crashes for most people.** Crash-free users on 1.3 were 37–39% on 14–15 Oct (iOS 1.0: 100%).
3. **Almost nobody comes back.** About 12% return on day 1, 3.5% on day 7, 1% on day 14.
4. **There is little traffic, and no way to tell where it comes from.** About 5 new users a day; every user is "Direct".

Fix them in that order. A better price on a purchase that fails earns nothing.

## What the data says

| Signal | Number | Read |
|--------|-------:|------|
| First opens | 464 (5.2/day) | ~155 a month |
| Active users, 30 day / 7 day / 1 day (15 Oct) | ~225 / ~72 / ~14 | DAU/MAU about 5–6% |
| Countries (active users) | India 171, US 51, UK 15, Germany 14, Iran 10, Canada 10, Australia 8 | India is about half; about 30% is in high-price countries |
| Onboarding | 5,063 step views for 464 installs (~11 of 14 steps each); `onboarding_complete` 153 | 33% finish |
| Onboarding paywall | seen 367 (inflated: the second paywall bug fixed in #43 double-counted), skipped 193 | |
| Premium screen views | 551 | |
| Purchase started / failed / cancelled / completed | 77 / 61 / 11 / 4 | **5% of attempts succeed** |
| Sign-in (account prompt) succeeded / failed | 83 / 59 | 40% fail; Google setup (Play app-signing SHA-1) |
| Widget add tapped | 71 | 15% of installs; widgets are the daily reason to keep the app |
| Share prompt shown / tapped / completed | 10 / 5 / 4 | no sharing loop |
| App removes | 266 | 57% as many as first opens |
| Crashes (`app_exception`) | 2,647 events for 1,139 sessions | crash loops, not one-offs |
| Retention by day | D1 11.6%, D2 7.6%, D7 3.5%, D14 1.1% | |
| Weekly cohorts returning in week 1 | 4% – 12.5% | |
| Acquisition channel | 100% "Direct" | no attribution at all |

## Ranked levers

### P0 — nothing else matters until these are fixed

**1. Make purchases succeed.** 79% of purchase attempts fail.
- Already shipped in #43: failures now log the RevenueCat error code, the double paywall is gone, test-store keys are ignored in release builds. Ship a build with it and read the codes in `premium_purchase_failed`.
- Most likely causes, in order: Google Play payments profile incomplete; subscription products or base plans not Active; RevenueCat offering not pointing at the live products; testers on a track that is not licensed. All four are console settings, not code. You fix them; I can't see them.
- Why first: attempts are already happening (77). **Estimate:** at today's traffic (~26 attempts a month) and a normal 70% success rate, that is about 18 purchases a month, roughly ₹6,000 (about US$70) a month gross at a ₹350 blended price. Small, but it is 18 purchases instead of 1, and every later lever multiplies it.

**2. Get the top Android crash stack traces.** Crash-free users 37% means most people who open 1.3 crash. They don't retain and they don't buy.
- Firebase Console → Crashlytics → the top three issues on 1.3, or Play Console → Android vitals → Crashes and ANRs.
- Paste the traces here. I can't fix a crash I can't see, and guessing would be wasted work.

### P1 — the biggest multipliers once P0 is done

**3. Price by country.** Yearly is ₹499 everywhere the store converts it. About 30% of active users are in the US, UK, Germany, Canada and Australia, where the same product is worth several times that. Starting points to test, not a recommendation to adopt blind: yearly US$14.99 / £12.99 / €13.99, monthly US$2.99, lifetime US$39.99, with India, Indonesia, Brazil etc. staying low. Set them per country in Play Console and App Store Connect, and test through RevenueCat. **Estimate:** the same purchase in a high-price country earns about 4–5× an Indian one.

**4. Capture the card at the start of the trial.** Today the 5-day preview needs no card: nothing is charged and nothing renews, so there is nothing to convert except people who come back on day 5 and decide to pay. With about 3.5% still active on day 7, very few reach that moment (`trial_preview_ended` fired 3 times). A store-managed free trial on the yearly plan (Play free-trial offer, App Store introductory offer), 3 days, auto-renews unless cancelled, with the renewal terms already shown by `formatRenewalTerms`. Card-on-file trials convert several times better than no-card previews in general; the right way to know is an experiment on your own traffic. Keep the 24-hour Life preview as the first taste.

**5. Fix retention before buying traffic.** 11.6% on day 1 is the number to move.
- **Retention reminders are off by default** (`DEFAULT_ENABLED = false` in `retentionNotifications.ts`) and the only switch is in Settings. 9 people turned them on in 90 days. Ask in the flow, with the value spelled out ("One line each morning: how much of today is left"), at the moment a person has just added a widget or seen their life grid.
- **Widgets are added by hand** ("Long-press home screen → Widgets → UNTIL → Day"). Android can ask the system to pin a widget in one tap (`requestPinAppWidget`); `WidgetBridgeModule.kt` already exists to host it. 15% add a widget today; this is the easiest place to double that. iOS has no equivalent.
- **No win-back.** Nothing contacts a person who stopped opening the app, apart from the reminders in the previous point. A day-3 and day-7 local reminder that says something specific ("Your week is 43% gone") is cheap.

### P2 — more reach

**6. Attribution.** Every user is "Direct". Use UTM-tagged Play links per channel (Instagram, Reddit, YouTube, website, QR) so you can tell which channel produces a paying user. Without this you cannot decide where to spend any time.

**7. Share loop.** The share image's caption says `built with UNTIL · until-app.com`. **That domain has no DNS records at all**, so everyone who sees a shared snapshot lands nowhere. Point it at the real site (or register the domain), add `?utm_source=share`, and put the Play link or a QR code on the image itself. Only 10 prompts were shown in 90 days, so also show it after a real moment (a badge, a finished countdown), not only from the Share screen.

**8. Listing and language.** Half the users are in India. A Hindi (or Hinglish) store listing and a Play "custom store listing" for India vs the rest cost nothing. The ASO and growth docs already describe the experiments; none has a result recorded.

**9. Onboarding length.** 14 steps; the average new user sees ~11 and a third finish. Before cutting anything, export `onboarding_step_view` broken down by `step` (Firebase → Events → onboarding_step_view → parameter `step`) and cut where the drop is steepest. The paywall sits after all 14 steps and before the first Home visit.

**10. Review prompt.** 114 review requests for ~230 monthly users, none tied to a good moment. With crash-free users at 37%, asking now collects bad reviews. Hold it back until crashes are fixed, then ask after a positive moment (badge unlocked, countdown completed), not on app-open count.

### P3 — structural

**11. Web and desktop checkout.** The Mac and Windows app are free but cannot sell anything ("Purchases stay on the phone"), and the website has no checkout. A web checkout (Razorpay/UPI for India, Stripe elsewhere) avoids the 15–30% store fee and does not depend on the Play payments profile. It needs the same server piece as the device-policy fix: a Cloud Function that is the only writer of `users/{uid}/entitlement/current` (see `DEVICE_POLICY.md`). Build that once and it also closes the premium-spoofing hole. App Store rules limit pointing iOS users to external purchase, so advertise it on the website and desktop app, not inside the iOS app.

**12. Weekly plan.** ₹49 a week is ₹2,548 a year, five times the yearly price. People who forget to cancel get a large bill, which means refunds and one-star reviews. Consider keeping it for India only, or dropping it from the paywall once yearly has a trial.

## Problems in the code and config that cost trust or money

| Finding | Where | Fix |
|---------|-------|-----|
| `until-app.com` has no DNS records, so `support@until-app.com` (privacy, terms and copyright pages) bounces and every share link is dead | `website/src/domain/config.ts`, `ShareSnapshotScreen.tsx:224` | Register the domain and set up the mailbox, or switch both to an address and site you control. Stores expect a working contact address. |
| `LoginScreen.tsx` is 401 lines and nothing imports it | `src/features/account/ui/LoginScreen.tsx` | Delete (hygiene, no behaviour change). |
| License-key purchase path does nothing: `UNTIL_LICENSE_API` is unset, so activation always answers "not available" | `LicenseVerificationServiceAdapter.ts` | Either build the backend (see P3-11) or remove the UI so no one is offered a dead flow. |
| Every local reminder is Android-only (retention, trial-ending, day-2 nudge, and the permission request itself) | `retentionNotifications.ts`, `trialReminders.ts`, `engagementNotifications.ts`, `notificationPermission.ts` | iOS users get no reminders at all, including the one that warns the preview is ending. Add the iOS path with the same value-first prompt. |
| Google sign-in fails for ~40% of attempts | Firebase project | Add the **Play app-signing SHA-1** (Play Console → App integrity) to the Firebase Android app. |
| Premium spoofing and device-cap bypass | Firestore rules | See `DEVICE_POLICY.md`. |

## 30-day order of work

| Week | Do | Who |
|------|----|-----|
| 1 | Ship the build with #43; check Play payments profile, product status and RevenueCat offerings; read the new purchase error codes | You (consoles), me (read the codes) |
| 1 | Crashlytics top three stack traces → fix → release 1.3.x | You paste, I fix |
| 1 | Fix the dead domain and support mailbox; add the Play app-signing SHA-1 | You |
| 2 | One-tap widget pin, value-first reminder opt-in, day-3/day-7 win-back, delete `LoginScreen.tsx` | Me |
| 2 | UTM links per channel; fix share link and add QR | Me + you |
| 3 | Per-country prices and a 3-day yearly trial as an experiment | You (consoles), me (copy and paywall) |
| 4 | Read D1/D7, purchase success rate and paywall → purchase per country; decide web checkout | Both |

## What to measure

Purchase success rate (completed ÷ started, target above 70%), crash-free users (above 99%), D1 and D7 retention, widget add rate, paywall views → purchases by country, first opens by channel. A weekly export of the Firebase overview is enough.

## Open questions

- Is the Play payments profile complete, and are all four products Active?
- Is the live Play listing's contact email the developer account's email or the dead `until-app.com` one?
- Are the per-country prices already set, or is everything converted from ₹?
- Do you want a store trial to replace the 5-day preview, or sit alongside it?
