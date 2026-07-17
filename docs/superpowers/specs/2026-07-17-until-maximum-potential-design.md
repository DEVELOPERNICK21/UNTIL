# UNTIL — Maximum Potential Product Strategy

**Date:** 2026-07-17  
**Status:** Approved direction  
**Goal:** Turn UNTIL from an awareness vitamin into a must-pay painkiller for a focused audience, while closing revenue leaks and shipping promised premium value.

---

## Executive summary

UNTIL already solves **time awareness** better than most memento-mori competitors: real day/month/year/life math, Ember, native widgets, overlay, Wear OS, and a psychology-driven onboarding funnel. What blocks revenue is not design quality — it is **(1) premium leaking on native surfaces**, **(2) selling a behavior feature that does not exist**, and **(3) positioning as a nice-to-have instead of solving an urgent daily pain**.

This plan closes leaks first, ships one painkiller loop, then layers retention and growth. Target: move from ~vitamin conversion to painkiller conversion for users who feel they are **losing hours to autopilot**.

---

## Research synthesis

### Competitors (memento mori / life calendar)

| App | Model | Premium unlock |
|-----|--------|----------------|
| [Memento Mori Weeks of Life](https://apps.apple.com/us/app/memento-mori-weeks-of-life/id6757088808) | Freemium | **Widgets** (3 sizes), themes, life expectancy |
| [memento mori - Life Calendar](https://apps.apple.com/us/app/memento-mori-life-calendar/id6761737420) | Freemium IAP | Deeper history, customization, pro features ($7.99–$24.99) |
| [Memento Mori (web)](https://mementomori.me/en/subscriptions) | Trial + sub | Full calendar, week completion, life % monitor |
| [Mori](https://mori-the-app.com/learn-more) | **$1.99 one-time** | Widgets + life grid (no subscription) |

**Pattern:** Widgets are the #1 premium driver in this category — passive, always-visible mortality/time reminders. UNTIL is correctly positioned here; enforcement must match.

### Painkiller vs vitamin ([RevenueCat](https://www.revenuecat.com/blog/growth/how-subscription-apps-can-become-painkillers/), [Airbridge](https://www.airbridge.io/en/blog/painkiller-vs-vitamin-app-pricing))

- **Vitamin:** "See your life" — nice, low urgency, easy to churn.
- **Painkiller:** "Stop losing today to nothing" — urgent, daily, worth paying to keep.
- Painkiller apps can convert **5–9×** better when motivation is acute ([Airbridge](https://www.airbridge.io/en/blog/painkiller-vs-vitamin-app-pricing)).

**UNTIL today:** Strong vitamin (awareness). Weak painkiller (intervention stub). Premium is mostly **surfacing** (widgets/overlay), not **outcome**.

---

## Current diagnosis (code-verified)

| Area | Status | Impact |
|------|--------|--------|
| Core time math + Home | REAL | Trust / retention |
| Month/Life **native** widgets | REAL but **ungated** | Revenue leak |
| Overlay month/life | REAL but **ungated** natively | Revenue leak |
| Activity intervention | **STUB** (domain only) | Trust + value gap |
| 5-day preview + quiz funnel | REAL | Conversion infrastructure |
| Social proof at paywall | Hidden (null count) | Weak ask |

---

## Positioning shift

**From:** "Watch your life pass" (memento mori for everyone)  
**To:** "Catch the day before it disappears into nothing" (for people who doomscroll, busywork, or feel days blur)

### Primary audience (painkiller segment)

- Feels **days disappear** without progress
- Already tried screen-time apps but wants **meaning**, not just limits
- Will pay for **persistent reminders** (widgets/overlay) + **one behavior nudge** (intervention)

### Secondary audience (vitamin)

- Curious about life-weeks visualization
- Free tier (day/year widget + share) — word of mouth, not primary payers

---

## Product pillars (maximum potential)

### Pillar 1 — Unmissable presence (Premium)

Month/Life widgets, overlay, Dynamic Island — **always on**, emotionally loaded. Must be **natively enforced** so paying feels necessary.

### Pillar 2 — One daily painkiller (Premium)

**Nothing-time intervention:** log or infer wasted hours → limit → red moment: *"This day will never repeat."* Closes awareness → action loop. Domain layer already exists.

### Pillar 3 — Personalized time map (Onboarding → retention)

Quiz funnel + life-weeks aha + results cards → user owns a plan. Paywall = "keep your map" (already built).

### Pillar 4 — Habit stack (Free → Premium bridge)

Daily tasks, goals, counters — free tools that make UNTIL the **daily open**, not a one-time novelty. Premium adds life/month surfaces + intervention.

### Pillar 5 — Trust & ethics (India-first)

Free day/year forever, honest preview copy, no fake timers — keep; adds LTV vs refund risk.

---

## Roadmap

### Phase 0 — Stop the bleed (Week 1) **SHIPPED**

| # | Deliverable | Status |
|---|-------------|--------|
| 0.1 | Persist `premium.effectiveAccess` (trial-inclusive) for Android | Done |
| 0.2 | Gate Month/Life widgets on Android | Done |
| 0.3 | Gate Month/Life overlay on Android | Done |
| 0.4 | Gate Month/Life widgets on iOS | Done |
| 0.5 | Update `docs/SUBSCRIPTION.md` | Done |

**Success:** Free user with expired trial sees lock state on Month/Life widget and overlay, not live data.

### Phase 1 — Ship the painkiller MVP (Week 2–3) **SHIPPED (v1)**

| # | Deliverable | Status |
|---|-------------|--------|
| 1.1 | **Intervention banner** on Home when nothing-hours exceed limit (premium) | Done — `InterventionHomeCard` |
| 1.2 | **Minimal log UI** — track wasted time toggle + +30m / +1h quick log | Done |
| 1.3 | **Settings:** daily nothing limit (1h / 2h / 3h chips) | Done |
| 1.4 | Free users see locked intervention teaser → Premium CTA | Done |
| 1.5 | Paywall still lists intervention — now delivered | Done |

**Success:** User can feel a consequence when wasting time; premium keeps the nudge.

### Phase 2 — Conversion loops (Week 4–5) **PARTIALLY SHIPPED**

| # | Deliverable | Status |
|---|-------------|--------|
| 2.1 | Verified social proof count at paywall | Ready in code; hidden until a real count is provided |
| 2.2 | Trial day 3–4 local notification ("preview ending — here's what locks") | Already shipped via `TRIAL_REMINDER_DAYS` (days 3, 4, 5) |
| 2.3 | Post-share soft upgrade prompt (strategy doc rank #5) | Done — after successful snapshot share for non-premium users |
| 2.4 | Tighten Life unlock: consider shorter 24h preview or gate month **detail** if data supports | Defer until analytics confirms paywall leakage |

### Phase 3 — Differentiation (Month 2) **SHIPPED**

| # | Deliverable | Status |
|---|-------------|--------|
| 3.1 | **Weekly reflection** tied to life grid (competitor pattern) | Done — Sunday morning Time Coach card + life-grid copy |
| 3.2 | Ember tips linked to quiz answers (goal/drain personalization) | Done — personalized tips prepended on Ember routes |
| 3.3 | Widget themes for premium (low effort, high perceived value) | Done — accent palette in-app + synced to native Day/Month/Year/Life widgets |
| 3.4 | Student plan verification flow | Done — soft school-email gate before student SKU purchase |

### Phase 4 — Growth (Month 3+) **PARTIALLY SHIPPED**

| # | Deliverable | Status |
|---|-------------|--------|
| 4.1 | Play Store ASO: "life weeks widget", "memento mori", "time awareness" | Done (copy) — paste from `docs/PLAY_STORE_ASO.md` into Play Console |
| 4.2 | Short-form content: life-weeks reveal clips (onboarding aha) | Deferred (marketing / outside repo) |
| 4.3 | Referral: share snapshot with subtle "built with UNTIL" | Done — bottom watermark + share caption + `until-app.com` |
| 4.4 | Analytics dashboard: funnel drop-off by quiz step | Done (instrumentation) — `step_index` on `onboarding_step_view`; see `docs/ANALYTICS_FUNNEL.md` |

---

## Pricing (keep live Play Store)

No package or trial day changes without Console update. Current stack is sound:

- Yearly ₹499 primary, Lifetime ₹1,499 decoy, 5-day in-app preview
- Psychology: per-day framing, loss vs monthly reference, emotional paywall

**Optional later:** Monthly on paywall as anchor (₹99) — only after native gating proves conversion lift.

---

## Metrics (north star)

| Metric | Target direction |
|--------|------------------|
| Onboarding → paywall view | >85% |
| Paywall → subscribe (warm traffic) | 8–15% (painkiller segment) |
| Preview → paid | 35–45% (strategy doc) |
| D7 retention (subscribers) | >40% |
| Refund rate | <3% (don't sell undelivered features) |

Track in PostHog: `onboarding_step_view`, `onboarding_paywall_view`, purchase events, widget add attempts while locked.

---

## What NOT to do

- Don't add fake urgency timers
- Don't paywall day/year/share (trust guarantee)
- Don't expand premium benefits list without shipping
- Don't chase Noom-length onboarding — rhythm yes, 100 screens no

---

## Immediate next action

**Roadmap code + ASO copy are ready.** Remaining manual / outside-repo work:

1. **Paste ASO** from [`docs/PLAY_STORE_ASO.md`](../../PLAY_STORE_ASO.md) into Play Console
2. **Commit** the large uncommitted batch (or split PRs) before the next AAB
3. **Social proof (2.1):** set `verifiedActiveWatchers` when you have a real count
4. **Short-form (4.2):** film life-weeks aha clips for Reels/Shorts
5. **Life unlock (2.4):** only after funnel analytics show leakage

Device-test intervention, accents, and share watermark on a release build before promoting.
