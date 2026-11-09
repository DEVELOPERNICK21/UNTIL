# 05 · Conversion optimization plan

Date 2026-11-04. Tags: `[CODE]` `[DATA]` `[BENCH]` `[ASSUME]` `[MISSING]` ([legend](README.md#how-claims-are-labelled)). Journey: **Store → Install → Onboarding → First experience → Widget setup → Habit → Paywall → Subscription → Renewal.** Every code change below is a proposal and has not been applied.

## 1. The journey as built

```
Play/App Store listing  [MISSING]
  → install → first open (trial preview clock starts here)           TrackAppOpenUseCase.ts:18
  → 1 brand · 2 day demo · 3 widgets demo (+ one-tap Android pin)    quizFunnel.ts:13
  → 4 goal · 5 drain · 6 interstitial ("15–25 hrs/week")
  → 7 birth date (identity) · 8 life-weeks reveal                    "You have lived N weeks"
  → 9 values · 10 cadence · 11 readiness · 12 loader (2.6 s fixed)   OnboardingScreen.tsx:142
  → 13 results · 14 paywall (RevenueCat dashboard paywall)
  → account prompt (Apple / Google / email; skip asks to confirm)
  → Home (cards, Ember, streak, reflection, quests)
  → later: 2nd foreground → deferred paywall → Premium screen       deferredPaywall.ts
  → 3rd open: 24 h Life unlock → "Life preview ended" modal
  → day 3–5: preview-ending reminders → preview ends → locked Month/Life
```

Reported numbers `[DATA]`: 5,063 step views for 464 first opens (about 11 of 14 steps each), 153 completions (33%), 71 `widget_add_tapped` (15% of installs, before one-tap pin), 551 premium screen views, 77 purchases started, 61 failed.

## 2. Friction by step

| Step | What I found | Tag | Fix | Metric | Effort |
|------|--------------|-----|-----|--------|--------|
| **Store listing** | The title is "UNTIL : Countdown & Time Left" (`docs/PLAY_STORE_ASO.md`). "Countdown" attracts people who want an event countdown, which is what the many $1–$15 countdown apps do; UNTIL's pull is *time awareness / life in weeks*. Wrong-intent installs would show as poor D1. Live listing unseen | `[CODE]` + `[MISSING]` | See [07](07-aso-strategy.md): intent-matched title and screenshots, custom listing for India | Store conversion; D1 by source | Low |
| **First screen (value in 10 s)** | "Your time is limited. UNTIL makes that visible so you spend it on purpose. Day, month, year, and life on screen and as home widgets." The idea is stated in one screen, then two interactive demos follow before any question. This is good | `[CODE]` `onboarding.prompt.brandTitle` | Keep. Test the sub-line without "so you spend it on purpose" (a productivity promise the app does not measure) | Step 1→2 pass-through | Low |
| **Length** | 14 steps, then paywall and account prompt: 16 screens before Home. Average new user reaches ~11; 33% finish | `[CODE]` + `[DATA]` | Do not cut blindly: long quiz-plus-paywall flows are a known winning pattern in subscription apps, and RevenueCat names onboarding as the main retention lever `[BENCH]`. First export `onboarding_step_view` by `step` (B4), then cut at the steepest drop. Candidates: merge steps 2–3, drop the interstitial and the loader, merge cadence and readiness (a 5-question quiz to a 3-question one) | Completion rate; D1 | Low–Medium |
| **Interstitial and results numbers** | "Small daily leaks add up to about 15–25 hrs/week" and "~{{hours}} hrs/week could shift to what matters" are fixed constants (12–21 by answer), not measurements, under a "Based on your 5 answers" header | `[CODE]` `quizFunnel.ts:48-54` | Present as an illustration ("If you reclaimed 10 hours a week…") or source the statistic. Un-sourced numbers in a health-adjacent frame invite review friction and erode trust; the audit rule against invented numbers applies to the product too | Trust; review sentiment | Low |
| **Fake loader** | 2.6 s "Building your time map… Matching your answers to a weekly plan…" before results. No plan is built; the results are three sentences | `[CODE]` | Remove or cut to ~1 s. One of 16 screens that the user waits through | Time to Home | Trivial |
| **Birth date (step 7)** | Sensitive and needed for the Life reveal; also drives the age gate | `[CODE]` | Keep (it creates the aha). Test a "year only" field with a clear "stays on this device" line | Step pass-through | Low |
| **Preview vs paywall** | The 5-day preview already started at first open; the paywall then asks for money for what they have | `[CODE]` | Choose: (a) keep the preview and make the paywall say "You have 5 days free. Start your plan to keep it" or (b) replace with a store trial (see 03). Today's message contradicts the state | Paywall→purchase | Low (copy) / Medium (trial) |
| **Paywall design** | The onboarding paywall is a RevenueCat dashboard design `[MISSING]`. The custom fallback paywall has: hero, loss frame, feature tiles, compare strip, 3 plan cards, CTA, renewal text, lifetime link, student link, restore, terms: ten blocks | `[CODE]` | Review the RC paywall; trim the custom one to hero, 2–3 benefit lines, plans, CTA, terms, restore | Paywall→start | Medium |
| **INR text** | See [03](03-revenue-and-monetization-audit.md) defect 1 | `[CODE]` | Compute from the store's numeric price or remove: "Save 30% vs monthly", "about {{x}}/day" | Trust; conversion in 30% of users | Low |
| **Stacked paywalls** | Onboarding RC paywall → deferred RC paywall on the second foreground → custom Premium screen on dismiss | `[CODE]` | Set the "deferred shown" flag when the onboarding paywall is shown or skipped; never show two unprompted paywalls in the first 3 days; keep the 48 h cooldown | Paywall views per user; Day-1 retention | Trivial |
| **Account prompt after paywall** | An extra screen with a confirm-to-skip dialog sits between the paywall and Home; sign-in failed ~40% on Android `[DATA]` | `[CODE]` | Move account creation to a moment that needs it ("Use UNTIL on your watch and desktop"), not the first minute | Time to first Home; sign-in success | Low |
| **After purchase** | `onPurchaseSuccess` simply moves on | `[CODE]` | Land the buyer on "Add your Life widget now" (one-tap pin on Android; step-by-step on iOS). Realized value in the first minute is the best defense against first-month cancellation (35% of annual cancellations happen in month 1 `[BENCH]`) | Widget added after purchase; early cancel rate | Low |
| **Purchase process** | Store sheet via RevenueCat; that part is standard. 79% of attempts failed `[DATA]` | `[DATA]` | Console fixes first ([03](03-revenue-and-monetization-audit.md)); show a recoverable message (retry, restore, contact) instead of the raw error text | Purchase success rate | Low |
| **Premium communicated** | Loss frame ("the cost of waiting"), compare strip free vs Premium, "Day & year stay free forever" | `[CODE]` | Keep the free-forever line (trust). Lead with one benefit, not six | — | Low |
| **Timing** | Paywall at end of onboarding, again via deferred, plus upgrade moments (life preview ended, widget gate, post-share) | `[CODE]` | Keep the end-of-onboarding paywall (peak intent after the Life reveal). The other surfaces should wait until the user has had a reason to return (D2+) | Revenue per paywall view | Low |
| **Renewal** | Renewal text under the CTA; no pre-renewal notice, no billing-issue banner, no cancel survey | `[CODE]` | Schedule a local "your yearly plan renews in 3 days" notice from the customer-info expiry (honest, reduces refunds); billing-issue banner; RevenueCat Customer Center for cancel feedback | Refund rate; involuntary churn | Medium |

## 3. Quick wins (no console access needed)

| # | Change | Outcome | Effort | Priority |
|---|--------|---------|--------|----------|
| Q1 | Replace INR display strings with store-derived or neutral text | No rupee symbol next to a dollar price | Low | P0 |
| Q2 | Mark deferred paywall as shown when the onboarding paywall appears | One unprompted paywall in the first days | Trivial | P0 |
| Q3 | Remove the 2.6 s loader and shorten the 1 s splash | ~3.6 s faster first run | Trivial | P1 |
| Q4 | Fire `paywall_shown` only after presentation; add plan-selected and dismissed events | Honest funnel counts | Low | P0 |
| Q5 | "You have N days free" copy on the paywall while the preview is active | Message matches state | Trivial | P1 |
| Q6 | Reword the interstitial and result numbers as an illustration | Trust | Trivial | P1 |
| Q7 | Move the account prompt out of the first minute | Shorter path to Home | Low | P1 |
| Q8 | Post-purchase "add your Life widget" step | Realized value | Low | P1 |

## 4. Paywall experiments (value propositions)

Run in RevenueCat Paywalls + Experiments (RevenueCat can target by country and split offerings). **At today's traffic these cannot reach statistical significance** (about 5,100 viewers per arm for a 50% lift, see [03 §4](03-revenue-and-monetization-audit.md#can-you-actually-run-these-sample-size-reality)); run them one at a time, sequentially, as a learning loop with the stated minimum views, and promote only large differences or those that also win on a second metric.

| ID | Value proposition | Headline (draft) | Proof element | Audience | Primary metric | Secondary | Minimum before reading |
|----|-------------------|------------------|---------------|----------|----------------|-----------|------------------------|
| **W-A** | **Feeling: my life on my screen** (memento mori) | "Keep your life where you can see it." | The user's own life-weeks grid, weeks lived filled, the weeks left in the accent colour, over a lock-screen mockup | Everyone (control candidate) | Revenue per paywall view | Trial start rate | 150 views |
| **W-B** | **Everywhere: one purchase, all my devices** | "Your time on your phone, watch and desktop." | Device row: phone, watch, Mac, with the 5-device account line | Users with a watch paired or a desktop download tap; US/UK/DE | Revenue per view | Lifetime share | 150 views |
| **W-C** | **Make it yours: personalization** | "Make your time look like you." | Live carousel of widget styles and accents the user can swipe; locked ones marked | Android widget owners | Revenue per view | Widgets customized after purchase | 150 views |
| **W-D** | **Awareness to action: find the hours you lose** | "See the hours you lose, and get them back." | Lost-time card and weekly reflection mock based on their own quiz answers | Users who chose "check-ins" or the "social" drain in the quiz | Revenue per view | Weekly reflection views after purchase | 150 views |
| **W-E** | **Low-commitment: try a week** | "Try Premium for 7 days free." | Store free trial on yearly (see P-5), no-charge-today line | Everyone, after the trial exists | Trial start → paid | Day-0 cancel rate | 100 trial starts |
| **W-F** | **Structure: two plans vs three** | Same copy as the winner | Yearly + Monthly (+ Lifetime in high-price markets) vs the current Yearly/Monthly/Weekly | Everyone | Revenue per view | Refunds | 150 views |

Expected-impact and effort ratings, priorities and measurement for each are in the [experiment backlog](10-90-day-execution-roadmap.md#experiment-backlog). Honest expectation: A/W-A and W-B are the most likely winners because they are the only two that sell something a competitor does not. This is a hypothesis.

## 5. What to measure on this page's changes

- Onboarding completion and time to Home (should fall from the 16-screen path).
- Paywall views per user in days 0–3 (should be 1).
- Purchase success rate (completed ÷ started; target >70% `[ASSUME]`).
- Revenue per paywall view, by country.
- D1/D7 for users who saw the shorter path vs the older path (before/after, because arms are too small).
