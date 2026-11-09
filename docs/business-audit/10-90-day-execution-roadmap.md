# 10 · 90-day execution roadmap and experiment backlog

Day 1 = Wed 2026-11-04 · Day 30 = Thu 2026-12-03 · **Day 59 = Fri 2027-01-01** · Day 90 = Mon 2027-02-01. Tags: `[CODE]` `[DATA]` `[BENCH]` `[ASSUME]` `[MISSING]` ([legend](README.md#how-claims-are-labelled)). **Every item that changes code is a proposal: I will show the diff and wait for your approval before applying anything.** "You" = console, store and content work only you can do; "Me" = code and analysis after approval.

Two facts shape the order:

1. **Revenue is gated by purchase success and crashes**, not by price ([01](01-executive-business-audit.md)). Days 1–30 fix those before growth work.
2. **New Year is the likely annual peak for a year-progress app** (`[ASSUME]`, check last January in Play Console) and falls on Day 59. Anything for the peak must be shipped by about **Day 46 (Dec 19)**, with a freeze over the holidays and the peak observed rather than re-engineered.

Effort: **S** under a day, **M** 1–3 days, **L** over 3 days, of development; "—" for console/content work.

## Days 1–7 (4–10 Nov): facts, quick wins, analytics gaps

| # | Task | Expected outcome | Pri | Effort | Depends on | Success metric |
|---|------|------------------|:---:|:------:|-----------|----------------|
| 1.1 | Pull exports A1–A9 ([DATA_REQUESTS](DATA_REQUESTS.md)) | Real revenue, product state, crash traces | P0 | — | You | All A items received |
| 1.2 | Console fixes for purchases: payments profile, product status, RevenueCat offering ↔ product mapping, Google sign-in SHA-1 | Purchases can complete | P0 | — | 1.1 | A license-tester purchase on the internal track completes end to end |
| 1.3 | Read crash traces; check the `dataSync` foreground-service hypothesis ([02](02-app-performance-scorecard.md)) | A cause for the 37% crash-free figure | P0 | — | 1.1 | Top 3 crashes explained |
| 1.4 | Register GA4 custom dimensions; turn on BigQuery export; check RevenueCat → PostHog and → Firebase integrations | Next export can slice purchase failures | P0 | — | You | `error_code`, `plan_id`, `source`, `step` selectable in a report |
| 1.5 | Replace `support@until-app.com` with an address you control; register or drop the dead domain | Reachable support contact | P0 | S | You | Test email delivered; store listing and site match |
| 1.6 | Tag the website's Play buttons with UTM | Website visits become attributable | P1 | S | Me | First "website" source in Firebase |
| 1.7 | Present **code proposal #1** as a diff: INR strings, deferred-paywall flag, remove 2.6 s loader and trim splash, paywall events | One decision, then it ships with 2.1 | P0 | S–M | Me, then your OK | Approved or amended |
| 1.8 | Answer: is iOS live and on which version? | iOS plan made or deferred | P1 | — | You | Status known (C1) |
| 1.9 | Reply to every Play review; ask the 2 testers that matter for the crash | Goodwill, signal | P2 | — | You | 100% of reviews replied |

## Days 8–30 (11 Nov–3 Dec): conversion, monetization, ASO, stability release

| # | Task | Expected outcome | Pri | Effort | Depends on | Success metric |
|---|------|------------------|:---:|:------:|-----------|----------------|
| 2.1 | Ship the stability release (crash fixes + proposal #1 + #2 analytics events + overlay `onTimeout` if confirmed) | Fewer crashes, honest funnel | P0 | M–L | 1.3, 1.7 | Crash-free users >99% (Play vitals) 7 days after rollout; purchase success >70% |
| 2.2 | Set country prices (P-1/P-2 starting tiers) in Play Console and App Store Connect; keep India as is | Higher revenue per payer in high-price markets | P0 | — | 1.1 (A6) | Prices live; revenue per paywall view by country tracked |
| 2.3 | Store-managed 7-day yearly trial (Play offer, App Store intro offer, trial-aware paywall copy) and decide the fate of the 5-day no-card preview | Card-on-file trial; preview no longer contradicts the paywall | P0 | M (code for copy and terms) | 2.1 | Trial starts per paywall view; trial → paid |
| 2.4 | Onboarding trim from step-level data (B4): remove loader, merge demo steps, merge cadence/readiness, move account prompt later | Shorter path to Home | P0 | M | 1.1 (B4) | Onboarding completion ≥45% (from 33%) |
| 2.5 | ASO v2 on Play: title, short, long, screenshots 1–2 first ([07](07-aso-strategy.md)) | Higher store conversion | P0 | — | You | Store conversion vs peer median (B2), before/after |
| 2.6 | Native review of listing and billing text: Hindi, Marathi, German, Japanese; check `premium.renewal.*`, `premium.disclosure.*`, `premium.preview.*` in all languages | No embarrassing or misleading store/billing text | P0 | — | You | Reviewer sign-off per language |
| 2.7 | Localized listings and screenshots for en-IN, hi, de, ja; custom store listing for India | Reach in the right countries | P1 | — | 2.6 | Listings live; installs by country |
| 2.8 | Review prompt gate: crash-free session, widget present, positive event; remove opens-based trigger | Fewer 1★ from bad moments | P1 | S | 2.1 | Rating trend; review prompt → review rate |
| 2.9 | Website: sitemap/robots/metadata, "How many weeks have I lived?" page, daily year-progress page | Search-driven installs | P1 | M | — | Impressions and clicks in Search Console |
| 2.10 | Content: publish 3 short videos a week on the feeling (see §Content) and tag every link | First measurable channel | P1 | — | You | ≥1 tagged source with installs |
| 2.11 | Billing hygiene: grace period and account hold on in Play; billing-issue banner; Customer Center | Lower involuntary churn | P2 | S–M | 2.1 | Billing-issue recovery rate (RC) |

## Days 31–60 (4 Dec–2 Jan): retention, New Year, sharing

| # | Task | Expected outcome | Pri | Effort | Depends on | Success metric |
|---|------|------------------|:---:|:------:|-----------|----------------|
| 3.1 | **Milestone engine v1**: year 25/50/75%, last 100/30 days, New Year, birthday, round weeks lived, month starts; max 1 extra push a week | Reasons to return that are calendar-driven | P0 | M | 2.1 | Opt-in; milestone push open rate; D30 among opted-in |
| 3.2 | **Share cards**: "Year in review", milestone and birthday cards with a QR and tagged link on the image | Sharing that brings installs | P0 | M | 3.1 | Shares per active user; installs with `utm_source=share` |
| 3.3 | Reminder opt-in at the "widget added" moment; configurable reminder hour | Higher opt-in | P1 | S–M | 2.1 | Opt-in rate; notification opens |
| 3.4 | Day-3 "make your widget yours" nudge; post-purchase "add your Life widget" step | Ownership; realized value | P2 | S | 2.1 | Customization saves; first-month cancel rate |
| 3.5 | Paywall experiments W-A then W-B (sequential, minimum 150 views per cell) | Pick the stronger story | P1 | S (RevenueCat dashboard) | 2.1, 2.3 | Revenue per paywall view |
| 3.6 | **Release freeze Dec 19** (Day 46), hotfix path ready | Stable peak | P0 | — | 3.1–3.4 | Zero P0 bugs open at freeze |
| 3.7 | iOS: if live, same ASO v2 and an Apple Watch/Dynamic Island screenshot set; if not, finish the launch path | iOS channel | P1 | — | 1.8 | App Store conversion baseline |
| 3.8 | Peak watch (Dec 25–Jan 8): daily dashboard, reply to reviews within 24 h | Capture the peak | P0 | — | — | Installs, crash-free, purchase success daily |

## Days 61–90 (3 Jan–1 Feb): read, scale, decide

| # | Task | Expected outcome | Pri | Effort | Depends on | Success metric |
|---|------|------------------|:---:|:------:|-----------|----------------|
| 4.1 | Read the peak: installs, conversion, D1/D7 by source and country, revenue per install | A real baseline replaces assumptions | P0 | — | 3.8 | Model [09](09-revenue-projection-model.md) re-run with actuals |
| 4.2 | Scale what worked: double the best content format; reuse best screenshots in all languages | More of the winning channel | P1 | — | 4.1 | Installs per post; cost in hours per install |
| 4.3 | Product Hunt launch (mobile + desktop story), plus 15 targeted outreach messages (widget, productivity, Stoicism, ADHD-adjacent creators; app review sites) | One bounded spike and backlinks | P1 | — | 4.1 | Installs and site traffic from `utm_source=producthunt` |
| 4.4 | Price round 2: lifetime $29.99 vs $39.99, weekly on/off, India tier | Tune the price ladder with real data | P1 | — | 4.1 | Revenue per paywall view |
| 4.5 | Retention round 2: keep, change or kill each push type by measured open and disable rates | A smaller, better set | P1 | S | 4.1 | Disable rate <10% per month |
| 4.6 | Decide web checkout / referral program only if net cash >$1,000 a month or installs >5,000 a month | Avoid building too early | P2 | L | 4.1 | Gate met or deferred |
| 4.7 | **Day-90 review**: continue / change / maintain mode | A decision, not a drift | P0 | — | 4.1 | Written decision below |

### Day-90 decision rules (set now, apply then)

| If, over the last 30 days | Then |
|---------------------------|------|
| Purchase success ≥70% and crash-free ≥99% but installs <500 a month | Distribution is the problem. Pick one organic channel and double it; consider maintenance mode for new features |
| Installs ≥2,000 a month and revenue per install <$0.10 | Monetization is the problem. Run price round 2 and a hard-paywall test in the US/UK only |
| Revenue per install ≥$0.30 and installs growing | Scale content and localization; consider the Pro tier and web checkout |
| Crash-free <99% | Stop all growth work until fixed |

## Content strategy (growth, brief)

The principle: **communicate the feeling, not the screenshots.** Five repeatable formats, each shot on a phone in under a day:

1. "Your life in weeks" reveal: type a birth year, the grid fills, a pause, one line of text (the strongest format).
2. "How much of the year is gone" on the 1st of each month and at 25/50/75% (calendar-driven, repeatable).
3. Real home/lock screens of real people, with permission (user-generated; widgets are conversation starters).
4. "What 4,000 weeks looks like" and Stoic/memento-mori quotes with the grid behind them (reference the book as a topic, not as a keyword).
5. Founder notes: why a calm version, one decision made, one screen redesigned (founder-led, honest).

Channels in order: Instagram Reels and TikTok (same video), YouTube Shorts (same video), Reddit (r/getdisciplined, r/Stoicism, r/androidapps — read each rule first; no ads), productivity and ADHD-adjacent communities (no medical claims), Product Hunt (once). Success is measured per tagged source: installs, onboarding completion, D7. No paid spend until net value per install passes the CPI of a channel ([09](09-revenue-projection-model.md)). Viral loop and share mechanics: cards with a QR and tagged link ([06](06-retention-strategy.md)); a website calculator; a lock-screen wallpaper export.

## Operating rhythm

| When | Do |
|------|----|
| Daily (peak weeks) | Crash-free, installs, purchase success, new reviews |
| Weekly (30 minutes) | Dashboard review ([04](04-analytics-tracking-plan.md)); one decision; log it |
| Fortnightly | One release; one experiment starts or ends |
| Day 30 / 60 / 90 | Re-run the revenue model with actuals; update this file |

---

## Experiment backlog

Fields: **Impact** = expected effect on the Target metric if it works (L/M/H). **Effort** = L/M/H development plus console. **Priority** P0 do first / P1 next / P2 later. Impact is a judgement, not a guarantee. **Read rule:** until traffic is roughly 10× today (see [03 §4](03-revenue-and-monetization-audit.md#can-you-actually-run-these-sample-size-reality)), treat "A vs B" as sequential before/after with minimum 100–150 views per cell, and prefer large changes.

### Monetization and pricing

| ID | Experiment | Hypothesis | Target metric | Impact | Effort | Pri | Measurement |
|----|-----------|------------|---------------|:------:|:------:|:---:|-------------|
| P-1 | High-price countries: yearly $14.99 / £12.99 / €13.99 (from ~$5.5) | Competitors charge $9.99–$29.99 a year `[BENCH]`; US/UK/DE buyers will not be deterred by the step | Revenue per paywall view, by country | H | L (console) | P0 | RevenueCat revenue and paywall views by country, 4 weeks before vs after; guardrail: paywall→purchase not down >40% |
| P-2 | High-price lifetime $39.99 vs $29.99 | Lifetime anchors of $19.99–$99.99 exist `[BENCH]`; 2.5–3× yearly is cash-positive | Lifetime share of payers; revenue per view | M | L | P1 | Lifetime purchases ÷ payers; revenue per view |
| P-3 | India yearly ₹349–399 vs ₹499 | ₹499 may be above the price a free-alternative market pays | Paywall→purchase in India | M | L | P2 | Purchases ÷ views in India; revenue must also rise |
| P-4 | Weekly on vs off (per country) | Weekly lifts conversion but raises refunds and 1★ | Revenue per view; refunds per 100 sales | M | L | P1 | RevenueCat refunds; review text search for "charged" |
| P-5 | 7-day store trial on yearly vs none | Card-on-file trials convert better than a no-card preview (5–9-day trials: ~37% trial→paid vs 25.5% for ≤4 days `[BENCH]`) | Trial starts; trial→paid; revenue per view | H | M | P0 | RevenueCat trial conversion; day-0 cancel rate |
| P-6 | Month widget free vs Premium | More widgets installed → more daily impressions; Premium story sharper | Widgets per install; D7; paywall→purchase | M | L | P2 | `widget_inventory`; D7 for both arms |
| P-7 | Lifetime as the highlighted plan in high-price markets | Some buyers prefer to pay once | Revenue per view | M | L | P2 | Plan mix |
| P-8 | Student plan on vs off (and promoted vs hidden) | A third yearly SKU may add little against its upkeep | Student purchases; support cost | L | L | P2 | RevenueCat purchases of `yearly_subscription_student` |
| M-1 | Monthly → yearly upgrade prompt at month 2 | Monthly payers pay more over a year on yearly | Upgrade rate; ARPPU | M | M | P2 | RevenueCat plan changes |
| M-2 | "2 countdown widgets free, unlimited with Premium" | A quantity gate on a repeated action converts better than a feature gate | Paywall→purchase from widget gate | M | M | P2 | Gate hits and purchases from `widget_gate` |

### Paywall

| ID | Experiment | Hypothesis | Target metric | Impact | Effort | Pri | Measurement |
|----|-----------|------------|---------------|:------:|:------:|:---:|-------------|
| W-A | Paywall "Keep your life where you can see it" (the user's own life grid) | The emotional core outsells a feature list | Revenue per paywall view | H | L | P0 | RevenueCat Paywalls + Experiments |
| W-B | Paywall "your time on phone, watch and desktop" | Cross-device is a unique, tangible value | Revenue per view | M | L | P1 | Same |
| W-C | Paywall "Make it yours" (style carousel) | Personalization converts widget-minded users | Revenue per view (Android widget owners) | M | M | P2 | Same |
| W-D | Paywall "find the hours you lose" | Behaviour-change story converts users who chose "social drain" | Revenue per view for that segment | L | M | P2 | Same |
| W-F | Two plans (yearly + monthly, + lifetime in high-price) vs three | Fewer choices convert better | Revenue per view | M | L | P1 | Same |
| W-G | Paywall moment: after the Life reveal vs end of onboarding vs after the first widget | Peak intent may be earlier | Paywall→purchase; D1 | M | M | P2 | Funnel events |

### Onboarding

| ID | Experiment | Hypothesis | Target metric | Impact | Effort | Pri | Measurement |
|----|-----------|------------|---------------|:------:|:------:|:---:|-------------|
| O-1 | Remove loader, merge steps, shorter quiz | 16 screens is more than the value needs | Onboarding completion; time to Home | M | L | P0 | Funnel; completion vs 33% `[DATA]` |
| O-2 | Account prompt after day 3 or on first cross-device need | Sign-in right after the paywall is friction (~40% fail `[DATA]`) | Time to Home; sign-ins later | M | L | P1 | `account_prompt_*` events |
| O-3 | "You have N days free" copy while preview is active | Message must match state | Paywall→start | L | L | P1 | Revenue per view |
| O-4 | Post-purchase "add your Life widget" | Realized value cuts first-month cancels | Widget added after purchase; month-1 cancel | M | L | P1 | `widget_pin_confirmed`; RevenueCat cancels |
| O-5 | Year-only birth field | Less sensitive, faster | Step pass-through | L | L | P2 | Step view → next |

### Retention

| ID | Experiment | Hypothesis | Target metric | Impact | Effort | Pri | Measurement |
|----|-----------|------------|---------------|:------:|:------:|:---:|-------------|
| R-1 | Offer the reminder right after the first widget | Intent peaks when value is understood | Reminder opt-in; D7 | H | L | P1 | `reminder_optin_*`, retention |
| R-2 | User-chosen reminder hour | 08:00 fits few people exactly | Notification open rate | M | L | P1 | `notification_opened` |
| R-3 | Year-milestone and birthday notifications | Calendar-driven reasons beat generic reminders | D30 among opted-in; opens | H | M | P0 | PostHog retention cohorts |
| R-4 | Countdown milestone pushes (30/7/1 day) | Countdowns are the stickiest personal object | Countdown-creator D30 | M | M | P2 | Cohort retention |
| R-5 | Day-3 customization nudge | Ownership improves retention | Widgets customized; D7 | L | L | P2 | Event + retention |
| R-6 | Sunday "week in a card" landing screen from the Sunday reminder | A ritual with a shareable output beats a bare reminder | Sunday opens; shares | M | M | P1 | Opens from `notification_opened` type; `share_completed` |
| R-7 | Month card on the 1st | Calendar beat with a share moment | Month-start opens; shares | M | M | P2 | Same |
| R-8 | Win-back at day 2 instead of day 3 | Earlier is better before the habit fades | Reactivation within 24 h | L | L | P2 | Reactivation rate; uninstalls |

### ASO

| ID | Experiment | Hypothesis | Target metric | Impact | Effort | Pri | Measurement |
|----|-----------|------------|---------------|:------:|:------:|:---:|-------------|
| S-1 | Screenshots 1–2: life grid and year dots first | The emotional image wins the thumbnail | Store listing conversion | H | L (assets) | P0 | Play Console conversion before/after; custom listing |
| S-2 | Title `UNTIL: Life in Weeks Widget` | Matches the high-intent query better than "Countdown" | Search impressions; installs from search | M | L | P1 | Play Console by traffic source |
| S-3 | Localized listings (en-IN, hi, de, ja, then others) | Native-language listings convert better | Conversion by country | H | M | P1 | Play Console by country |
| S-4 | Custom store listing for India vs the rest | Different value stories by market | Conversion by country | M | L | P1 | Same |
| S-5 | Icon: new vs previous (`design/icon-backup/`) | Icon is the largest browse-conversion driver | Store listing conversion | L | L | P2 | Needs traffic; likely inconclusive now |

### Referral, growth and features

| ID | Experiment | Hypothesis | Target metric | Impact | Effort | Pri | Measurement |
|----|-----------|------------|---------------|:------:|:------:|:---:|-------------|
| G-1 | QR and tagged link printed on the share image | Today the image carries no link; the caption does | Installs with `utm_source=share` | M | L | P1 | Firebase acquisition |
| G-2 | Milestone share cards ("My year is 50% gone", "My 1,500th week") | Milestones are the natural moment to share | Shares per active user | H | M | P0 | `share_completed` by `share_type` |
| G-3 | Website "how many weeks have I lived?" calculator with install CTA | High-intent web query for the niche | Site → Play clicks; installs from `website` | H | M | P1 | UTM + Search Console |
| G-4 | Lock-screen wallpaper export of the year grid | Visible, shareable, competitor does it `[BENCH]` | Wallpaper exports; installs from shares | M | M | P2 | Event + attribution |
| F-1 | iOS widget setup walkthrough (iOS cannot pin) | iOS widget adoption is the activation gap | Widget-added rate on iOS (proxy) | M | L | P1 | Self-reported step + retention |
| F-2 | Align watch Life pages with Premium | Life is free on the wrist, paid on the phone | Paywall→purchase; watch usage | L | L | P2 | Purchases among watch users |

Total: 40 experiments. (W-E in [05](05-conversion-optimization-plan.md) is the same test as **P-5**.)

## Risks to this plan

| Risk | Mitigation |
|------|-----------|
| Console fixes in week 1 do not fix purchases | RevenueCat export (A1–A3) and `error_code` show the next layer; escalate to RevenueCat support with product IDs |
| Crash cause is not what I suspect | The overlay `onTimeout` item is a hypothesis; the traces decide |
| Traffic never rises, so experiments never read | The day-90 rules: change channel or move to maintenance mode instead of testing more |
| New Year peak is smaller than assumed | Last January's Play installs by day will say; if flat, drop the peak-specific work and keep the milestone engine |
| Scope creep | Features not in this plan wait for Day 90; the freeze applies |
