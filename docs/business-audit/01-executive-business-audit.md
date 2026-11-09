# 01 · Executive business audit

Date 2026-11-04 · Tags: `[CODE]` verified in repo · `[DATA]` reported in the 2026-10-21 audit · `[BENCH]` external benchmark · `[ASSUME]` my input · `[MISSING]` needs an export ([legend](README.md#how-claims-are-labelled), [requests](DATA_REQUESTS.md)).

## The verdict, plainly

UNTIL is a well-built product with no business around it yet. In the 90 days to 15 October it earned **US$0.99** `[DATA]`, from about 464 first opens (~5 a day) `[DATA]`. That is not a pricing problem. Four things stack, and the order matters:

1. **Purchases mostly fail.** 77 started, 61 failed, 11 cancelled, 4 reported completed `[DATA]`. The code now logs the reason `[CODE]`, but whether the console side is fixed is `[MISSING]`.
2. **The Android app crashed for most people.** Crash-free users 37–39% on 1.3 `[DATA]`. Version on disk is still 1.3 (versionCode 34) `[CODE]`.
3. **Almost nobody comes back.** D1 11.6%, D7 3.5%, D14 1.1% `[DATA]`. Typical lifestyle/productivity medians are D1 ~23–24%, D7 ~9–10%, D30 ~4.5–5% `[BENCH: MWM, US Q3 2025]`, so D7 is about a third of the median.
4. **There is almost no traffic, and it is all "Direct"** `[DATA]`.

Fix them in that order. A better price on a purchase that fails earns nothing, and a perfect paywall shown to a crashing app earns nothing.

## The uncomfortable arithmetic

Using the revenue model in [09](09-revenue-projection-model.md) (all inputs `[ASSUME]`, tagged there):

- At today's ~155 installs a month, even a *working* funnel with the proposed prices yields roughly **$20–100 of net revenue a month**. The aggressive 12-month scenario totals about $2,200 net.
- Reaching **US$1,000 of net cash a month** needs on the order of **7,000 installs a month** under realistic conversion and mix (about 45× today), or 3,600 under aggressive assumptions.
- A cross-check: RevenueCat's median revenue per install at day 60 for freemium subscription apps is $0.38 `[BENCH]`. The realistic scenario lands at $0.17 per install over 24 months, because the audience is India-heavy and priced in rupees.

So the business is limited by **distribution first and price second**. No monetization change in this audit changes that order. What monetization can do is make every install worth 2–4× more (pricing by country, a working trial, lifetime in high-price markets) so that the traffic that does arrive pays.

## What is actually good

| Strength | Evidence |
|----------|----------|
| A real, emotionally strong core idea (life in weeks, days left) with a clear free-to-paid line | Free: Day and Year widgets and Share; Premium: Month and Life widgets, overlay, Dynamic Island, lost-time alerts `[CODE]` `src/features/premium/domain/premium.ts` |
| Unusually wide surface area for a solo app | Android widgets (8 providers), iOS widgets + lock-screen accessories, Dynamic Island/Live Activity, floating overlay, Wear OS Time Hub, Apple Watch app, Tauri desktop app `[CODE]` |
| 11 languages across the whole app | en, hi, mr, es, de, fr, pt-BR, id, ru, tr, ja; parity tests in CI `[CODE]` `__tests__/i18nLocales.test.ts`; no native review yet `[CODE]` `docs/LOCALIZATION.md` |
| Disciplined engineering | 98 entries in `__tests__/` (mostly test files), architecture and ownership tests, privacy defaults test `[CODE]` |
| Honest monetization ethics already written down | No fake timers, visible cancellation, one interstitial per session `[CODE]` `docs/MONETIZATION_STRATEGY.md` (but see finding 6 below on the code not fully matching) |
| Value-first onboarding quiz that ends in a personal "time map" | 14-step funnel `[CODE]` `quizFunnel.ts:13` |
| Real analytics instrumentation (~105 event names) in two systems | `[CODE]` `src/shared/analytics/analytics.ts` |

## What is weak (brutally)

1. **The product's core feature is a commodity.** Year-progress and countdown widgets are sold for $0.99–$14.99 a year on iOS `[BENCH]` and a free Android app with 20 widgets, habits and life weeks sits at ~13K installs and 4.96★ from 174 ratings `[BENCH: AppGoblin, 2026-11-04]`. "Shows how much of the year is gone" is not a reason to pay. The differentiators worth leaning on are emotional framing, the life-weeks view, wearables and the overlay, and none of them is communicated on the store pages I can see (docs only; live listing `[MISSING]`).
2. **Scope far ahead of distribution.** Six surfaces and 11 languages for ~155 installs a month. Each surface adds support, store-review and bug cost. Another widget, another language or another companion screen will not move the number.
3. **The Premium reason is partly arbitrary.** *Month* is Premium, but "how much of this month is gone" carries little emotional weight; people pay for things that are personal (their life, their dates) and for customization. Today's paywall sells "Month, life, and overlay" `[CODE]` `premium.paywall.onboardingSub`.
4. **The free preview and the paywall work against each other.** The 5-day no-card Premium preview starts at the very first app open, before onboarding finishes `[CODE]` `TrackAppOpenUseCase.ts:18`. The onboarding paywall that follows then asks the user to buy something they already have for five days, and only ~3.5% are still active on day 7 `[DATA]` to see it end.
5. **Paywalls can stack.** The deferred paywall fires on the second app foreground and does not know the onboarding paywall was already shown `[CODE]` `deferredPaywall.ts:9-15`, `OnboardingPaywallScreen.tsx` (no `markDeferredPaywallShown`). Then dismissing it opens the custom Premium screen. The written rule is one interstitial per session `[CODE]` `MONETIZATION_STRATEGY.md`.
6. **The paywall shows rupee strings to everyone.** "Less than ₹1.37/day", "Save ₹1,289" and a struck-through "₹1,788/year" are hard-coded INR and sit beside a store price in the user's own currency `[CODE]` `monetization.ts:16-18`, `usePaywallPrices.ts:50`. About 30% of active users are in the US, UK, Germany, Canada or Australia `[DATA]`. This is not in the 2026-10-21 audit.
7. **Pricing is rupee-denominated and not tiered.** ₹499 a year is about $5.5 `[ASSUME: ₹90 per US$]`. Competitors in the same niche charge $9.99–$29.99 a year `[BENCH]` (see [08](08-competitor-analysis.md)). Whether non-India countries are priced separately is `[MISSING]`.
8. **Revenue protection gaps.** Any signed-in user can write their own `entitlement/current` document `[CODE]` `firestore.rules`; the 5-device cap is client-side `[CODE]` `docs/DEVICE_POLICY.md`. Low priority at this volume, but it blocks any web or desktop checkout.
9. **Website support address is dead.** `support@until-app.com` returns NXDOMAIN today (checked by DNS lookup) and is the contact on the legal pages `[CODE]` `website/src/domain/config.ts:23`. Store policy expects a reachable contact.
10. **No attribution on the website's Play buttons** `[CODE]`, and no store-listing data to say whether the listing converts `[MISSING]`.

## What to stop doing

| Stop | Why |
|------|-----|
| New surfaces (more widgets, new watch faces, more desktop features) | Distribution, not features, is the constraint (see arithmetic). Freeze for 60 days. |
| More languages | 11 is already a lot to keep reviewed (`docs/LOCALIZATION.md` says no native review yet). Get Hindi, Marathi and the revenue markets (en, de, ja, fr, es) reviewed before adding any. |
| Planning from `docs/` without checking the code | Five docs contradict the code ([README](README.md#documentation-drift-found-along-the-way)). |
| Reading Firebase event *counts* as users | The earlier audit says so itself, and it matters when conversion is 5% of 77 attempts. |

## What to do, in order

| Step | Action | Tag |
|------|--------|-----|
| 1 | Make purchases succeed: read A1–A6 in [DATA_REQUESTS](DATA_REQUESTS.md), fix product/offering/payments-profile state in the consoles | `[MISSING]` |
| 2 | Fix the Android crash: read the Crashlytics traces (A7–A9), ship a build, confirm crash-free users >99% in Play vitals | `[MISSING]` |
| 3 | Add the missing funnel events and register custom dimensions so the next export can answer questions ([04](04-analytics-tracking-plan.md)) | `[CODE]` |
| 4 | Fix the paywall defects that need no console: INR strings, stacked paywalls, trial start moment ([05](05-conversion-optimization-plan.md)) | `[CODE]` |
| 5 | Price by country and test a card-on-file yearly trial ([03](03-revenue-and-monetization-audit.md)) | `[ASSUME]` |
| 6 | Move distribution from zero: ASO for the real search terms, UTM on every link, short-form content about the feeling, not the screenshots ([07](07-aso-strategy.md), [06](06-retention-strategy.md)) | `[ASSUME]` |
| 7 | Then, and only then, retention and sharing experiments ([10](10-90-day-execution-roadmap.md)) | `[ASSUME]` |

## The strategic bet

Position UNTIL as **"your time, on your home screen, with a point of view"**: the memento-mori / life-in-weeks feeling done calmly, not a countdown utility. Ride the combination the competitors I checked do not show together: *Android life-in-weeks widgets and overlay + Wear OS + Apple Watch + desktop*, a *calm* tone, and a *personalised "time map" from the onboarding quiz*. Language breadth is not unique: two iOS rivals list 19 and 30 languages ([08](08-competitor-analysis.md)); it is an advantage mainly against the Android rivals I found. Aim the paid audience at high-price markets (US, UK, DE, CA, AU, JP) with price tiers there, keep India as the volume and word-of-mouth market at its current rupee price.

This is a hypothesis, not a finding. [08](08-competitor-analysis.md) shows what is and is not verified about competitors.

## Decisions I need from you

1. Is iOS live, and on which version? (`[MISSING]`, C1)
2. Are you willing to **price high-price countries higher** (yearly $14.99, lifetime $39.99 as the starting test)? It is the biggest lever that needs no traffic.
3. Do you agree to a **60-day feature freeze** while the funnel, crash and distribution work happens?
4. Who owns the Hindi and Marathi native review before the next release?
5. Can the support address move to a domain you control this week?
