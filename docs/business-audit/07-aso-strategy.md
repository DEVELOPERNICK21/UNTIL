# 07 · ASO strategy (Google Play first, App Store second)

Date 2026-11-04. Tags: `[CODE]` `[DATA]` `[BENCH]` `[ASSUME]` `[MISSING]` ([legend](README.md#how-claims-are-labelled)). **I could not see either live listing, its ratings, reviews, conversion or search terms** (C5, C7, B1, B2, B7 in [DATA_REQUESTS](DATA_REQUESTS.md)). What follows audits the *intended* listing in the repo, benchmarks the competitors' public listings, and proposes the next version. Nothing here has been published.

## 1. Baseline: what the repo says the listing is `[CODE]`

| Element | Intended copy (`docs/PLAY_STORE_ASO.md`) | Assessment |
|---------|------------------------------------------|------------|
| Title (30) | `UNTIL : Countdown & Time Left` (29) | "Countdown" is the most crowded term in the category (countdown widget apps have 13M installs `[BENCH]`) and pulls event-countdown intent that UNTIL's strongest features (life weeks, year dots) do not serve. The spaced colon looks unpolished. Weak on the terms people use for the *emotional* niche (life in weeks, life calendar, year progress, memento mori) |
| Short description (80) | A: "Life weeks & day widgets. See time left. Catch the day before it's gone." (73) | Best of the three drafts; "life weeks" is the right lead. Add "year progress" |
| Full description | Feature list, Wear OS gets 3 bullets, "5-day free Premium trial included" | Opening line is generic. Wear OS (small audience) is ahead of life weeks and the year view. "Trial" is an in-app preview with no card, not a Play trial (`docs/PLAY_STORE_ASO.md` itself says so): call it a *free Premium preview*. No mention of languages, privacy (no account) or the desktop app |
| Keywords | Play has no keyword field; relevance comes from title, short and full description, and screenshots | The draft description never uses "year progress", "life calendar", "memento mori" or "days left widget" except in the short-description option B |
| Screenshots | Caption order: Day, Life weeks, Year, Intervention, Share, Premium | Order puts the strongest emotional image (life weeks) second and spends slot 4 on an alerts feature with low proven value |
| Category | Not in the repo `[MISSING]` | Competitors use Productivity (Android: Countdown & Year Progress), Lifestyle, Health & Fitness |
| Icon | New icon applied; previous in `design/icon-backup/` | Test, do not assume (see 5). Having the old one saved makes an icon experiment possible |
| Video | None referenced | Add one (7) |
| Ratings and reviews | `[MISSING]` | Unknown; likely hurt by the crash rate `[DATA]` |
| Localization | App in 11 languages; **store listing languages `[MISSING]`** | The biggest free ASO win if the listing is English-only (6) |
| iOS | `IOS_APP_STORE_ID` empty, website "iOS coming soon" `[CODE]`; no iOS metadata draft in the repo | Draft below |

## 2. Positioning

The category splits in two (from public listings, [08](08-competitor-analysis.md)):

| Cluster | Examples | Promise | Weakness |
|---------|----------|---------|----------|
| **Utility countdown / progress widgets** | Countdown Widget, Big Days, Year Progress, Widgetsmith | "Count down to your event", "see % of year" | Interchangeable; price-compressed |
| **Memento mori / life calendar** | Lifetime: Life Progress, Time Left Widgets, Mori, Weeks | "Your life in weeks", Stoic framing | **Almost all iOS-only** in the searches I ran; mostly English, a few with 2–30 languages; some lean morbid (a "death clock") |

UNTIL's open position: **the calm, multi-platform life-in-weeks app.** Android widgets and overlay, Apple Watch and Wear OS, a desktop app, 11 languages, no account needed `[CODE]`. No single competitor I checked shows that whole combination, though individual pieces are not unique (one iOS rival lists 19 languages and an Apple Watch app, another 30 languages). It is a hypothesis about the market, built from the pages I could fetch, and it is the claim to test with the store listing, not to assume.

Proposed one-line positioning: **"Your life in weeks and your year in dots — on your home screen, wrist and desktop."**

## 3. Keywords: where the demand probably is

No search-volume data was available to me. Tools to fill it: Play Console search terms (B1), AppTweak / Sensor Tower / AppFollow trial, or Google Keyword Planner and Trends for the web equivalents. Until then, this is intent-ranked, not volume-ranked.

| Intent group | Phrases | Evidence it is real | Where to place |
|--------------|---------|---------------------|----------------|
| Life calendar (core, emotional) | life in weeks, life calendar, weeks of life, life progress, life grid | Competitor names: "Life Calendar", "Life Time Left: 4K Weeks", "Lifetime: Life Progress" `[BENCH]` | Title and short description |
| Memento mori | memento mori, stoic, death clock (avoid "death" in the title) | "Memento Mori Life Calendar", "Mori: Stoic Death Clock" `[BENCH]` | Full description, one screenshot, App Store keyword field |
| Year progress | year progress, year progress widget, % of year, days left in year | "Year Progress: Life in Motion", "Year Progress: Widget", "Countdown & Year Progress" `[BENCH]` | Title or subtitle, full description |
| Time left | time left, days left, time remaining, time left widget | "Time Left Widgets", "Left - Widgets for Time Left" `[BENCH]` | Short description, full description |
| Widgets | home screen widget, lock screen widget, Wear OS widget | Widgetsmith, Countdown Widget `[BENCH]` | Full description, screenshots |
| Countdown (secondary, broad) | countdown, days until | Highest competition `[BENCH]` | Full description only; stop leading with it |
| "4000 weeks" | The book and its trend feed this niche (two competitors carry "4K Weeks" in the name) `[BENCH]` | Trademark and metadata policy caution: use as a *content* theme, not as keyword stuffing |

## 4. Proposed copy (drafts; character counts verified by script)

### Google Play

| Field | Options | Chars |
|-------|---------|------:|
| Title (30) | **`UNTIL: Life in Weeks Widget`** (preferred) · `UNTIL: Year & Life Progress` · `UNTIL: Time Left & Life Weeks` | 27 · 27 · 29 |
| Short (80) | **`Life in weeks, year progress & days-left widgets. Calm, private, no account.`** · `Life weeks, year progress & day widgets for phone, watch and desktop.` | 76 · 69 |
| Full, opening paragraph (the first lines are what most visitors read) | "See your life in weeks and your year in dots. UNTIL shows how much of today, this month, this year and your life has passed, on your home screen, lock screen, watch and desktop. Day and Year widgets are free forever. No account needed." | 235 |
| Full, structure | 1) The feeling (life weeks, year dots) 2) Widgets and overlay 3) Watch and desktop 4) Free vs Premium, stated plainly, "free Premium preview" not "trial" 5) Privacy: data on device, account optional 6) Languages (name them) 7) Support link | — |

If the title changes from "Countdown & Time Left", keep "Time Left" in the short description so existing searchers still match.

### App Store (if/when live)

| Field | Draft | Chars / limit |
|-------|-------|---------------|
| Name | `UNTIL: Life in Weeks` | 20 / 30 |
| Subtitle | `Year progress & time left` | 25 / 30 |
| Keywords | `calendar,memento mori,days,countdown,lifespan,widget,watch,stoic,mortality,percent,dots,birthday` (no repeats of words already in the name or subtitle; no spaces after commas) | 96 / 100 |
| Promotional text | `Your life in weeks, the year in dots, and the day as a ring. On your home screen, lock screen and wrist. Day and Year stay free.` | 128 / 170 |

Apple indexes name, subtitle and keywords, not the description; repeat no word across them.

## 5. Screenshots and creative

Principle: **one idea per screenshot, readable at thumbnail size, emotional caption first.** Only the first few show on the listing without scrolling. The repo has an in-house generator (`website/src/app/tools/aso-studio`) that exports sized assets `[CODE]`; use it.

| # | Caption (draft) | Shows | Job |
|---|-----------------|-------|-----|
| 1 | "Your life, in weeks." | Life grid, weeks lived filled, over a lock-screen/home mockup | The hook |
| 2 | "See the year go." | 365-dot Year widget on the home screen | Second emotional image |
| 3 | "Today, as a ring." | Day widget and live clock | Free utility, instant clarity |
| 4 | "On your wrist and your desk." | Apple Watch / Wear OS / desktop | Differentiator |
| 5 | "Make it yours." | Accent colours, presets | Premium reason |
| 6 | "Calm reminders. No noise." | Morning line, no streak pressure | Trust |
| 7 | "Free forever: Day and Year." | Free vs Premium strip | Removes price anxiety |
| 8 | "No account. In your language." | Language picker, privacy line | Reach |

Feature graphic: dark, one number ("2,184 weeks lived"), the wordmark, no feature list. **Icon:** the new icon is untested against the old; run a Play icon experiment only when traffic allows (see 8). **Video:** 20–30 s, silent-friendly captions: type your birth year, the grid fills, add the widget in one tap, lock screen. No voice.

## 6. Localization of the store listing

The app speaks 11 languages `[CODE]`; the listing may speak one `[MISSING]`. Order by expected value, not by language count:

| Priority | Languages | Reason | Caveat |
|----------|-----------|--------|--------|
| 1 | English (US, UK, India), German, Japanese | Highest-price markets that are in the app's language set | Japanese and German need native review before publish; bad copy lowers conversion |
| 2 | Hindi (+ Marathi) | India is about half of active users `[DATA]`; a Hindi listing and a custom listing for India cost nothing | Hindi/Marathi app strings have not been natively reviewed `[CODE]` `docs/LOCALIZATION.md`; do the review first |
| 3 | French, Spanish, Portuguese (Brazil) | Large reach, lower revenue per install | — |
| 4 | Indonesian, Turkish, Russian | Reach, price-sensitive | Russian store access and payments are constrained; check whether it is worth the effort |

Also localize screenshots for priorities 1–2 (caption text only). Play lets you add localized listings and custom store listings per country.

## 7. Reviews and ratings

| Lever | Plan | Status |
|-------|------|--------|
| Fix crashes first | Crash-free >99% before any push for reviews | The prompt currently fires after 5 foreground opens and 3 days, or after a finished countdown, with no stability gate `[CODE]` `inAppReviewEligibility.ts:3-4` |
| Ask at a good moment | After a positive event: the Life screen viewed twice, a badge unlocked, a countdown finished, a widget added and kept for 3 days. Never in the first session, never right after an error or a paywall | Proposal |
| Use only the native review dialog | Do not filter by sentiment ("Are you enjoying UNTIL?") before sending only happy users to the store; store guidance discourages it. Offer a separate "Send feedback" link in Settings | Proposal |
| Reply to every review | Especially crash and billing ones, within 48 h | `[CODE]` the repo's own checklist says so (`PLAY_STORE_GROWTH_CHECKLIST.md`) |
| Release notes | Say what was fixed ("Fixed widget not updating on Xiaomi") | Proposal |
| Rating gate | Do not run a shout-out campaign below 4.0★ | `[ASSUME]` |

## 8. Store listing experiments

Play store-listing experiments need enough traffic to read; at ~155 installs a month they will not reach significance (the same arithmetic as in [03](03-revenue-and-monetization-audit.md#can-you-actually-run-these-sample-size-reality)). Until volume is ~10× today:

- Make the best-evidence listing change and compare **before/after** by country and channel, not an A/B.
- Use **custom store listings** per country to give India a Hindi/INR-aware listing and the high-price markets the "life in weeks" version. That is a targeted split with no statistics needed.
- Queue, in this order: S-1 screenshots 1–2 (life grid first), S-2 short description, S-3 title, S-4 icon, S-5 video. One change at a time, 14 days minimum.

## 9. Organic beyond the store

| Asset | Why | Effort |
|-------|-----|--------|
| **Life-in-weeks calculator on the website** ("How many weeks have I lived?") | The highest-intent web query for the niche, with an install CTA; the site is Next.js and already hosts a clock toy `[CODE]` | Medium |
| **Year-progress page** ("How much of the year is gone?") that updates daily | Evergreen, seasonal peak around New Year, shareable | Low |
| Sitemap, robots, a real `<title>` and Open Graph image | None of them exists in the site tree I read `[CODE]` | Low |
| Tag the website Play buttons with UTM | Currently untagged `[CODE]` | Trivial |
| Custom domain | `developernick1-until.vercel.app` is the public URL; `until-app.com` does not resolve | Low |

## 10. Metrics and baseline

Store listing visitors → installs (conversion) by country and channel; impressions by search term (when shown); first opens ÷ installs; ratings by version; uninstalls within 24 h; rank for ten tracked phrases, checked weekly in a logged-out incognito window and recorded in a sheet. Baselines: all `[MISSING]` (B1, B2, B6, B7).

## 11. Differentiation, stated honestly

| Claim | Support | Risk |
|-------|---------|------|
| Multi-platform (Android, iOS, Wear, Apple Watch, desktop) | Built `[CODE]` | iOS and desktop availability unverified `[MISSING]` |
| 11 languages | Built, not native-reviewed `[CODE]` | Review quality; widgets and watch still English |
| Calm and private | No account needed, local storage `[CODE]` | Analytics default-on; say "your data stays on your device" only where true |
| Premium is optional, Day and Year free forever | Built `[CODE]` | The preview/paywall defects ([03](03-revenue-and-monetization-audit.md)) |
