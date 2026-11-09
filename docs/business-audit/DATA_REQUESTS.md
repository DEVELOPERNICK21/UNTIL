# Data requests — exactly what is needed, from where

I have no access to any console. Everything below is what turns the `[MISSING]` tags in these documents into numbers. Menu names are as the consoles label them at time of writing; if a label has moved, search for the report name. Use **last 90 days** unless a row says otherwise, and export CSV where the console allows (screenshots are fine when it does not).

Order of urgency: **A (needed first)** decides whether anything else matters. **B** sizes the problem. **C** sharpens the plan.

## A. Revenue is broken until proven otherwise

| # | Source | Report / path | Break down by | Why |
|---|--------|---------------|---------------|-----|
| A1 | RevenueCat | **Charts → Revenue** (daily) and **Overview → MRR, Active subscriptions, Active trials, New customers** | Store, Country, Product | The earlier audit says US$0.99 in 90 days, yet `premium_purchase_completed` fired 4 times `[DATA]`. This reconciles the two. |
| A2 | RevenueCat | **Products** page and **Offerings → default → Packages** (screenshot) | — | Are the 5 product IDs attached to the right packages, each in a store state that allows purchase? Wrong or inactive products are the first suspect for the 79% purchase failure. |
| A3 | RevenueCat | **Paywalls** → the published paywall attached to `default` (screenshot of every screen and its copy), plus **Experiments** if any exist | — | The onboarding paywall is the RevenueCat dashboard paywall, not code `[CODE]`. Its copy, prices shown and CTA decide most conversion and I cannot see it. |
| A4 | Firebase (or PostHog) | Event `premium_purchase_failed`, counts for the last 90 days | `error_code`, `plan_id`, `source`, country | The 61 failures need a reason. In Firebase these parameters only appear in reports if registered: **Analytics → Custom definitions → Create custom dimension** for `error_code`, `plan_id`, `source`, `step`. If you have the BigQuery export enabled, run it there instead (see B3). |
| A5 | Google Play Console | **Monetize with Play → Products → Subscriptions** (screenshot each of the four subscriptions and the one-time product) and **Settings → Payments profile** status | — | Product Active or not, base plans active, payments profile complete. |
| A6 | Google Play Console | **Monetize with Play → Products → Subscriptions → (plan) → Pricing** | Country | Are non-India prices converted from ₹499, or set? Decides the pricing experiment in 03. |
| A7 | Firebase Crashlytics | **Crashlytics → Issues**, filter version `1.3`, top 5 issues with full stack traces | Version | Crash-free users were 37–39% on 1.3 `[DATA]`. A crash cannot be fixed from a percentage. |
| A8 | Google Play Console | **Quality → Android vitals → Crashes and ANRs** and **Startup time**, overall and by app version and Android version | Version, device | Cross-check Crashlytics; Play ranks apps on these. |
| A9 | Codemagic / Play Console | **Release → Production** (and testing tracks): versions and dates actually live | — | Is anything newer than 1.3 (versionCode 34) live? Dates the Firebase data against the code. |

## B. Size the funnel

| # | Source | Report / path | Break down by | Why |
|---|--------|---------------|---------------|-----|
| B1 | Google Play Console | **Statistics** → "Store listing acquisitions" and "Store listing visitors" | Country, **Acquisition channel** (Google Play search / explore / third-party referrers / UTM) | Store conversion rate, where visitors come from. Needed for the ASO baseline in 07. |
| B2 | Google Play Console | **Grow users → Store presence → Store performance**, conversion benchmarks chart | Country, peer group | Google's own percentile for the listing; the best benchmark available. |
| B3 | Firebase | **Project settings → Integrations → BigQuery**: is the export on? If yes, export `events_*` for 2026-07-18 onward; if no, turn it on now (only collects forward) | — | Funnels by `step`, plan, source, country need event parameters; the console cannot slice them without custom dimensions. |
| B4 | Firebase | **Analytics → Retention** (cohort table) and **Engagement → Events → onboarding_step_view** by parameter `step` | Weekly cohort, `step` | D1/D7/D14 and the exact onboarding drop-off step (the earlier audit has averages only). |
| B5 | Firebase | **Analytics → Reports → Acquisition → User acquisition** | First user source / medium / campaign | Confirms whether UTM tagging works after the link fixes. |
| B6 | Google Play Console | **Statistics → Installs and uninstalls** (user installs, active devices, uninstalls) | Country, app version, Android version | Uninstall rate by version; install volume trend. |
| B7 | Google Play Console | **Ratings and reviews** — export reviews (download CSV) and rating by version/country | Version, country | What people complain about; whether crashes drive 1-star reviews. |
| B8 | RevenueCat | **Charts → Conversion (initial)**, **Trial conversion**, **Subscription retention**, **Churn**, **Refund rate** | Product, store | Real trial, renewal and refund rates replace the benchmarks in 09. Will be near-empty today; export it anyway so the baseline is dated. |
| B9 | PostHog (project 472860) | The 5 wizard insights (onboarding funnel, premium funnel, DAU, feature engagement, skip vs convert) as screenshots with the date range visible; plus **Persons → count by `platform` and `app_version`** | Platform, version | PostHog is dual-written beside Firebase `[CODE]`; unknown whether the production builds carry the PostHog key at all (`POSTHOG_ENABLED` needs `UNTIL_POSTHOG_API_KEY` at build time, `src/config/analytics.ts`). |
| B10 | Firebase | **Authentication → Users** by provider, and the Google sign-in failure reasons from the `account_*_signin_failed` events (`error_code` parameter) | Provider, error | Sign-in failed ~40% `[DATA]`; the Play app-signing SHA-1 is the suspected cause. |

## C. Sharpen the plan

| # | Source | Report / path | Why |
|---|--------|---------------|-----|
| C1 | App Store Connect | **App Store → (app) → iOS App → Version history / status** and **TestFlight** build list | Is iOS live? Which version? Decides whether iOS gets its own experiments. |
| C2 | App Store Connect | **Analytics → Acquisition** (Impressions, Product Page Views, Conversion Rate, Downloads) and **Retention** (D1/D7/D28), by Source type and Territory | iOS baseline, if live. |
| C3 | App Store Connect | **Sales and Trends → Subscriptions** (active, new, cancelled, billing retry) and **Payments and Financial Reports** | iOS revenue and churn. |
| C4 | App Store Connect | **Subscriptions → group → each product → Price by territory, Introductory offers** | iOS prices and whether any intro offer exists. |
| C5 | App Store Connect | **App Information / Version page**: the live Name, Subtitle, Promotional text, Keywords field, Description, localizations list, screenshots | iOS ASO baseline for 07. |
| C6 | Xcode Organizer | **Metrics**: Launch time, Hang rate, Memory, Battery, Disk writes; **Crashes** | iOS technical baseline. |
| C7 | Google Play Console | **Store presence → Main store listing** (copy the live Title, Short, Full description and screenshot order) and **Custom store listings**, **Store listing experiments** (any past result) | The live listing is the ASO baseline; the repo's `PLAY_STORE_ASO.md` is the intended copy, not proof of what is live. |
| C8 | Google Play Console | **Release → Setup → Advanced settings → Countries/regions** and **Store presence → Translations**: which countries and languages are live | Whether the new 11-language app has any matching store listings. |
| C9 | Google Play Console | **Quality → Android vitals → Battery / Excessive wakeups / Stuck partial wake locks** | Widget refresh every 15 minutes and the overlay service are battery-visible. |
| C10 | Google Search Console + Vercel Analytics for `developernick1-until.vercel.app` | Queries, impressions, clicks, top pages; visits and clicks on the Play button | Does the website bring anything? Also the starting point for a custom domain. |
| C11 | Domain registrar | Who holds `until-app.com`, and is a mailbox set up on any domain you own | `support@until-app.com` does not resolve `[CODE]` + DNS check; store reviewers and users cannot reach you. |
| C12 | Firebase | **Firestore → users** count, and Authentication user count | Rough measure of how many installs create an account. |
| C13 | You | Marketing spend to date, if any, by channel; any posts made (links, dates) | Needed to read attribution and cost per install. Not assumed to be zero. |

## What to send back

Paste or attach as-is. I will not guess missing values: a blank cell stays labelled `[MISSING]`. The first thing I would do with A1–A9 is reconcile revenue, close the purchase-failure question and read the crash traces; the model in 09 is then re-run with real conversion and mix by changing the inputs at the top of [revenue-model-calc.py](revenue-model-calc.py).
