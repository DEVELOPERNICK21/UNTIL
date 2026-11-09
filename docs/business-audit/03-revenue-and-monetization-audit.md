# 03 · Revenue and monetization audit

Date 2026-11-04. Tags: `[CODE]` `[DATA]` `[BENCH]` `[ASSUME]` `[MISSING]` ([legend](README.md#how-claims-are-labelled)). Prices in USD use **₹90 = US$1** `[ASSUME]`, the same rate as the earlier audit.

## 1. What is implemented

| Item | Implementation | Tag |
|------|----------------|-----|
| Billing stack | `react-native-purchases` 10.9.1 + `react-native-purchases-ui` (RevenueCat) on both stores; entitlement `premium`, offering `default` | `[CODE]` `package.json`, `src/config/revenueCat.ts` |
| Plans | Weekly ₹49, Monthly ₹149, Yearly ₹499, Lifetime ₹1,999 (one-time), Student yearly ₹249 behind a school-email check | `[CODE]` `src/config/monetization.ts:10-17`, `billing.ts` |
| USD equivalents | ≈ $0.54 / $1.66 / $5.54 / $22.21 / $2.77 | `[ASSUME]` |
| Paywall cards | Yearly (badged), Monthly, Weekly; Lifetime and Student as text links | `[CODE]` `billing.ts:29`, `PremiumPaywallBody.tsx` |
| "Trial" | 5-day in-app preview of everything Premium, **no card, not a store trial**; starts at the first app open; start synced per device to a Vercel KV endpoint so clearing storage does not restart it | `[CODE]` `monetization.ts:37`, `TrackAppOpenUseCase.ts:18`, `TrialPreviewApiAdapter.ts` |
| Extra taste | 24 h Life unlock after the third foreground open | `[CODE]` `TrackAppOpenUseCase.ts:23` |
| Paywall surfaces | RevenueCat dashboard paywall (onboarding, deferred, trial ending) with the custom paywall as fallback; custom paywall in Settings → Premium; modals for "Life preview ended" and "preview ending" | `[CODE]` `OnboardingPaywallScreen.tsx`, `DeferredPaywallModal.tsx`, `docs/MONETIZATION_SETUP.md` |
| Cancellation | "Manage subscription" opens the store's subscription page; renewal terms shown under the CTA; no pre-cancel flow, no reason capture | `[CODE]` `useManageSubscription.ts`, `paywallCopy.ts` |
| Failed payments | No billing-issue banner or grace messaging in the app | `[CODE]` (grep found none); store-side grace/hold settings `[MISSING]` |
| Refunds | Not visible in the app; handled in stores. Refund rate `[MISSING]` | — |
| Regional pricing | Constants hold ₹ only; `yearlyRegionalTier2Inr: 399` is defined but referenced nowhere else. Store-side per-country prices `[MISSING]` | `[CODE]` `monetization.ts:15` |
| Web/desktop checkout | None. Desktop is free but unlocks Premium via the signed-in account's entitlement document | `[CODE]` `docs/DEVICE_POLICY.md` |

### Free vs Premium as shipped

| Free | Premium (also during the 5-day preview and the 24 h Life unlock) |
|------|--------|
| Day and Year views and widgets, Share, countdowns, counters, daily tasks, badges, streak, Ember, daily reflection | Month and Life widgets, full Life screen and Home Life block, overlay (Month, Life), Dynamic Island / Live Activity (Month, Life), lost-time alerts, widget accent colours, extra reflection tones |
| Wear OS Time Hub including a **Life** page; Apple Watch Life page. No entitlement check exists in watch code | — |

`[CODE]` `premium.ts`, `widgetGating.ts`, `InterventionHomeCard.tsx`, `ShareSnapshotScreen.tsx`; watch sources contain no premium reference.

### Defects found (all `[CODE]`, none changed)

1. **INR text for every user.** "Less than ₹1.37/day", "Save ₹1,289" and the struck-through "₹1,788/year" are fixed strings (`monetization.ts:16-18`, `usePaywallPrices.ts:50`, `PremiumPaywallBody.tsx:138-147`) shown next to the store's localized price. A US user sees a dollar price for the year with `₹1,788/year` struck through beside it. This is on the custom paywall only; the RevenueCat dashboard paywall is `[MISSING]`.
2. **Preview starts before the paywall** (`TrackAppOpenUseCase.ts:18`): the onboarding paywall asks for money while the user already has everything for 5 days.
3. **Second paywall in the first days.** `shouldShowDeferredPaywall` needs only `appOpenCount >= 2` and a flag that the onboarding paywall never sets (`deferredPaywall.ts:9-15`). The open counter rises on every foreground return (`App.tsx:204`). After dismissal the user is sent to the Premium screen (`DeferredPaywallModal.tsx:44-48`).
4. **Life is free on the wrist, paid on the phone.** The watch Life pages are the same emotional core the paywall sells.
5. **Plan selection and paywall dismissal on the custom paywall are not logged** (see [04](04-analytics-tracking-plan.md)).

## 2. The eight questions

**1. Why would anyone pay?** There is no evidence either way: 77 purchase attempts in 90 days, 61 failed `[DATA]`, with no breakdown by plan or source `[MISSING A4]`. My working hypotheses about the payer, in order of strength:
- *Feeling:* "I want my life in weeks on my home screen / lock screen every day" (memento mori). Emotional, personal, hard to copy as a feeling.
- *Ownership:* "I want it to look like mine" (accent, shape, size). This is why widget apps sell themes `[BENCH: Widgetsmith, Countdown apps gate widgets and formats]`.
- *Everywhere:* "My time on phone, watch and desktop with one purchase." The 5-device account makes this real `[CODE]`, and the single-device competitors cannot say it.
- *Intervention:* lost-time alerts. Interesting but unproven; the paywall mentions it (`premium.loss.hours`).

**2. What makes Premium worth it?** One sentence it must pass: *"Keep your whole life on your screen — everywhere you look, in your style."* If a feature does not serve that sentence it should not be in the pitch. Month progress does not.

**3. What should stay free?** Day, Year, Share, countdowns, counters, tasks, streaks, badges, reminders. They are the acquisition, trust and retention engines; the share image carries the referral watermark. Keep the "Day and Year stay free forever" promise (`premium.compare.free`).

**4. What should become Premium?** Keep Life (home, lock screen, Live Activity, overlay, **and the watch Life pages**) and customization. Add one quantity gate on a thing people repeat, e.g. "2 countdown widgets free, unlimited with Premium", which is how countdown apps do it `[BENCH]`. Test moving **Month to free** (more widgets installed, more reasons to return) because the paid story is stronger without it. All of this is `[ASSUME]` until [experiments P-1 to P-8](#4-pricing-and-monetization-experiments) say otherwise.

**5. Is the price too low or too high?** *Both, by country.* ₹499 is about $5.5 everywhere the store converts it, while competitors in the same niche charge $9.99–$29.99 a year `[BENCH]` ([08](08-competitor-analysis.md)). In the US, UK, Germany, Canada and Australia, about 30% of active users `[DATA]`, it looks cheap. In India, about half of active users `[DATA]`, ₹499 a year for a widget app with free alternatives is not cheap, and ₹49 a week (₹2,548 a year, 5.1× the yearly price) is a bill-shock risk. This is a hypothesis; the only way to learn is a per-country price change.

**6. Does lifetime make sense?** Yes, with different prices by country. Typical yearly renewal is low: RevenueCat reports about 72% of annual subscribers cancel in year one `[BENCH, via the 2026 report page; verify]`, so a yearly payer is worth roughly 1.4× the yearly price over three years at best `[ASSUME: constant 28% renewal]`. A lifetime price of 2.5–3× yearly is therefore cash-positive and brings cash forward, which a bootstrapped app needs. Competitor anchors: $19.99 and $99.99 `[BENCH]`. In India ₹1,999 (4× yearly) will rarely convert; test ₹1,299–1,499. Cost of lifetime: indefinite support and backend cost for those users (Firebase, Vercel KV), small for a mostly offline app.

**7. Weekly, monthly, annual?** Keep **yearly as the default and the anchor**, **monthly as the comparison plan** and **lifetime as the exit ramp**. Treat **weekly as an experiment, not a pillar**: it can lift conversion (Mori charges $4.99 a week `[BENCH: AppGoblin]`) but it is the plan most likely to cause refunds and one-star "I was charged again" reviews. Test weekly on vs off per country, with refunds and rating as guardrails. Do not remove it blindly (`MONETIZATION_STRATEGY.md` calls it "low-risk try").

**8. How to raise revenue per paying user?** Ranked by size and effort, each tagged by evidence:
1. Price by country (the model gives +35% 12-month revenue in the realistic case versus current pricing, [09](09-revenue-projection-model.md)).
2. Lead with lifetime in high-price markets (+18% if its share of payers goes from 15% to 25%).
3. Yearly trial with the card (a conversion lever more than an ARPPU one; see [05](05-conversion-optimization-plan.md)).
4. Monthly-to-annual upgrade prompt at month 2 (both stores support upgrades; already on the roadmap `MONETIZATION_STRATEGY.md`).
5. Reduce involuntary churn: turn on grace period and account hold in Play Console, show a billing-issue banner. Google Play payment failures are 31% of cancellations, App Store 14% `[BENCH: RevenueCat 2026 page]`.
6. Customer Center for cancellation feedback and win-back offers (RevenueCat ships one; availability in this SDK version to be confirmed).
7. Do **not** add a fifth plan, a packs store, or bundle extras. Complexity lowers conversion.

## 3. Recommended monetization model

| Layer | Recommendation | Evidence level |
|-------|----------------|----------------|
| Free | Day, Year, Share, countdowns, counters, tasks, reminders, streaks/badges; Month (test) | `[ASSUME]` |
| Premium | **Life everywhere** (phone, lock screen, Live Activity, overlay, watches, desktop) + **customization** + 2+ unlimited counts | `[ASSUME]` |
| Plans per market | Yearly default, Monthly, Lifetime; Weekly only where it tests well | `[ASSUME]` |
| Trial | Store-managed 7-day free trial on **yearly only**; keep the 24 h Life unlock; retire the global 5-day no-card preview if the experiment wins | `[BENCH]` for the direction, `[ASSUME]` for the length |
| Prices (starting test, not adoption) | See below | `[ASSUME]` anchored on `[BENCH]` |

| Market | Yearly | Monthly | Weekly | Lifetime |
|--------|-------:|--------:|-------:|---------:|
| India (keep) | ₹499 (test ₹349–399) | ₹149 | ₹49 or off | ₹1,299–1,499 (test) |
| US, UK, CA, AU, DE, FR, JP, other high-price | $14.99 / £12.99 / €13.99 | $2.99 | $0.99 or off | $39.99 |
| Brazil, Indonesia, Turkey, Mexico, Russia, others | $7.99 equivalent | $1.99 | off | $24.99 |

Setting these is a Play Console and App Store Connect action (Subscriptions → pricing by country), not a code change. The paywall already prints the store's price string `[CODE]`; only the INR helper strings need to become neutral or computed ("Save 30% vs monthly", per-day price from the store's numeric price).

## 4. Pricing and monetization experiments

Detailed rows with hypothesis, metric, impact, effort, priority and measurement are in [10](10-90-day-execution-roadmap.md#experiment-backlog). The pricing ones:

| ID | Change | Primary metric | Guardrail |
|----|--------|----------------|-----------|
| P-1 | High-price countries: yearly $14.99 (from ~$5.5) | Revenue per paywall view, by country | Paywall→purchase rate not down more than 40% |
| P-2 | High-price lifetime $39.99 vs $29.99 | Lifetime share of payers and revenue per view | Rating |
| P-3 | India yearly ₹499 vs ₹349 | Paywall→purchase | Revenue per view must also rise |
| P-4 | Weekly on vs off | Revenue per view, refunds per 100 sales | Reviews mentioning "charged" |
| P-5 | 7-day yearly trial vs none | Trial start rate, trial→paid, 90-day revenue per view | Refund and cancel-in-day-0 rate |
| P-6 | Month free vs Premium | Widgets per install, D7, paywall→purchase | Premium conversion |
| P-7 | Default highlight yearly vs lifetime (high-price markets) | Revenue per view | — |
| P-8 | Student plan on vs off | Student purchases, support cost | Complexity |

### Can you actually run these? (sample-size reality)

A two-arm test that detects a 50% relative lift on a 1.5% purchase rate (to 2.25%) at 80% power needs about **5,100 paywall viewers per arm** `[ASSUME: 1.5% base; standard two-proportion formula n = 2(1.96+0.84)² p̄(1−p̄)/δ²]`. At ~155 installs a month that is years. Consequences:

- Until traffic is roughly 10× today, do **not** A/B test small copy or price differences. Ship the evidence-backed fixes (purchase success, INR strings, one paywall, trial), and read results as before/after with the country as a natural control (prices differ by country, so a change in one country is not contaminated by another).
- Judge tests by *revenue per paywall view* and *completed purchases*, with a minimum of 100 paywall views per cell before reading anything, and treat small differences as noise.
- Qualitative signals count at this scale: every refund reason, every review, every support email.

## 5. Things not to do now

| Idea | Why not now |
|------|-------------|
| Web checkout (Razorpay/Stripe) | Saves roughly the store fee (15% on a small-business rate `[BENCH, verify: Apple Small Business Program 15%, Google subscription fee 15%]`), costs a Cloud Function, webhooks, tax/GST handling and refunds. Only worth it above roughly $1,000 net a month. The earlier audit ranked it P3; I would defer. US App Store rules on external links are still in litigation `[BENCH: Epic v. Apple, 2026]`. |
| Hard paywall | Hard-paywall apps earn $3.09 per install at day 60 versus $0.38 for freemium `[BENCH: RevenueCat 2026 page]`, but this app's growth path depends on free Day/Year widgets, the share loop, store ratings and the "free forever" promise. Reconsider per country (US/UK) after the funnel works, as an experiment with a rating guardrail. |
| Social proof line | `verifiedActiveWatchers` is null `[CODE]`; at ~225 monthly users the number would hurt. Leave it hidden. |
| Student plan promotion | One more product to maintain for an audience of unknown size; keep, do not promote. |
| License-key path | The screens are gone; remove the adapter and use case when convenient (hygiene, not revenue). |

## 6. What I need to finish this section

A1–A6 and B8 in [DATA_REQUESTS](DATA_REQUESTS.md): revenue by product and country, the dashboard paywall, product status and per-country prices. With those I can replace every `[ASSUME]` in the plan table above with the real current price per country and the real purchase mix.
