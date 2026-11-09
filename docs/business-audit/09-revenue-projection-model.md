# 09 · Revenue projection model

Date 2026-11-04. Reproduce every number with `python3 docs/business-audit/revenue-model-calc.py` ([script](revenue-model-calc.py), standard library only). **These are scenarios, not forecasts.** Every input is either `[DATA]` (reported 2026-10-21), `[BENCH]` (external) or `[ASSUME]` (mine). No actual revenue exists to calibrate against: the earlier audit reports US$0.99 in 90 days `[DATA]`. Replace inputs with real values once the exports in [DATA_REQUESTS](DATA_REQUESTS.md) arrive.

## 1. What the model says, in four lines

1. At today's traffic, the best case here is **about $20–100 of net revenue a month**; the realistic 12-month total is **about $630**, aggressive **about $2,200**, conservative **about $70**.
2. The number that moves revenue most is **install volume**, then **install-to-paid conversion**, then **price by country**. All three are roughly multiplicative.
3. Retention *of subscribers* (renewal, months paid) barely moves 12–24 month revenue at these price points; retention of *users* matters because it feeds conversion and installs through ratings.
4. To reach **US$1,000 net cash a month** you need about **7,000 installs a month** under realistic assumptions (3,600 under aggressive, 35,000 under conservative). Today is about 155.

## 2. Inputs

| Input | Conservative | Realistic | Aggressive | Tag and source |
|-------|:-----------:|:---------:|:----------:|----------------|
| New installs, month 1 | 155 | 155 | 155 | `[DATA]` ~5.2 a day |
| Monthly install growth | 5% | 15% | 25% | `[ASSUME]`; what ASO, localization, content and the New Year peak could do |
| Install → paid (35 days) | 0.5% | 1.5% | 2.5% | `[ASSUME]`; median is 2.1% for freemium apps `[BENCH: RevenueCat 2026]`; today ≈ 0.2% at best (4 completed per 464 installs, or one revenue event) `[DATA]` |
| Payer mix: yearly / monthly / weekly / lifetime | 50 / 20 / 15 / 15 | 60 / 15 / 10 / 15 | 60 / 12 / 8 / 20 | `[ASSUME]`; the repo's own target was ~70 / 15 / 15 `[CODE]` `MONETIZATION_STRATEGY.md` |
| Payer geography (India / high-price / other) | 40 / 40 / 20 | same | same | `[ASSUME]`; active users are ~50% India, ~30% high-price `[DATA]`, with payers skewed to high-price markets |
| Pricing | Current (₹ converted) | Tiered | Tiered | See [03](03-revenue-and-monetization-audit.md) |
| Average months paid, monthly plan | 2.5 | 3.5 | 5.0 | `[ASSUME]` |
| Average weeks paid, weekly plan | 2 | 3 | 4 | `[ASSUME]` |
| Yearly renewal after year 1 | 20% | 30% | 40% | `[BENCH]` ~72% of annual subscribers cancel in year 1 (RevenueCat 2026 page) → ~28% renew |
| Store fee | 15% | 15% | 15% | `[BENCH, verify]` Apple Small Business Program 15%; Google subscriptions 15% (structure changed in 2026, check Google's page) |
| Refunds | 6% | 4% | 3% | `[ASSUME]` |
| Exchange rate | ₹90 = $1 | same | same | `[ASSUME]` |

Blended **gross** prices across the payer geography mix:

| Plan | Current pricing | Tiered pricing (India as is; high-price $14.99 / $2.99 / $0.99 / $39.99; other $7.99 / $1.99 / $0.69 / $24.99) |
|------|----------------:|-----------------------------------------------------------------------------------------------------------------|
| Yearly | $5.54 | $9.81 |
| Monthly | $1.66 | $2.26 |
| Weekly | $0.54 | $0.75 |
| Lifetime | $22.21 | $29.88 |

## 3. Results (12 months, starting at 155 installs a month)

| | Conservative | Realistic | Aggressive |
|--|-------------:|----------:|-----------:|
| Installs in month 12 | 265 | 721 | 1,804 |
| Installs, 12-month total | 2,467 | 4,495 | 8,402 |
| New payers, 12-month total | 12 | 67 | 210 |
| **Net revenue, 12-month total** | **$69** | **$628** | **$2,214** |
| Net cash in month 12 | $7 | $101 | $477 |
| Normalized MRR at month 12 (yearly/12 + monthly; excludes weekly, lifetime) | $3 | $35 | $113 |
| ARR run-rate (MRR × 12) | $37 | $418 | $1,354 |
| Net value per payer, 24 months | $6.11 | $11.05 | $13.04 |
| **Net value per install, 24 months** | **$0.03** | **$0.17** | **$0.33** |

Net means after refunds and the store fee. Costs (developer accounts, tooling, translation review, your time) are not included; profit is therefore lower, and I have no cost data `[MISSING]`.

Sanity checks:
- Net value per install of $0.17–$0.33 compares with a **median $0.38 per install at day 60 for freemium subscription apps** `[BENCH: RevenueCat 2026 page]`, a US-weighted figure. UNTIL's India-heavy base should land below it; the model does.
- Today's actual: US$0.99 gross over 464 installs, about **$0.002 net per install** `[DATA]`.
- Paid user acquisition cannot pay back at $0.03–$0.33 per install. **Do not buy installs.**

## 4. Where conversion comes from (funnel view)

Install-to-paid is a product of steps already measured or measurable:

`conversion = onboarding completion × share of completers who attempt a purchase × purchase success rate`

| Onboarding completion | Attempt rate (`[ASSUME]`) | Purchase success | Install → paid |
|:--------------------:|:-----------------------:|:----------------:|:--------------:|
| 33% (today `[DATA]`) | 6.5% | 21% (today `[DATA]`) | **0.45%** |
| 33% | 6.5% | 70% | 1.50% |
| 45% | 6.5% | 70% | 2.05% |
| 55% | 6.5% | 70% | 2.50% |
| 55% | 9.0% | 70% | 3.46% |
| 33% | 4.0% | 70% | 0.92% |

Reading: fixing purchase success alone (21% → 70%) triples conversion; lifting onboarding completion from 33% to 55% adds another two-thirds. Both are the plan in [05](05-conversion-optimization-plan.md). The attempt rate is the unknown to measure. **Warning:** the 77 "purchases started" in the earlier audit are events, not people; failing purchases get retried, so do not read 77 as demand (the earlier audit's "18 purchases a month" estimate rests on that count `[DATA]`).

## 5. Sensitivity (realistic scenario, 12-month net revenue)

| Change | Revenue effect |
|--------|---------------:|
| Install growth 15% → 20% a month | **+36%** |
| Installs +25% every month | +25% |
| Conversion 1.5% → 2.0% | **+33%** |
| Conversion 1.5% → 1.0% | −33% |
| Tiered prices → current (₹-converted) prices | **−35%** |
| Tiered prices but 30% fewer high-price-market payers | −17% versus full tiered; still above current pricing. Tiering only loses if high-price-market payers fall by more than about 60% |
| Lifetime share 15% → 25% (from yearly) | +18% |
| Yearly share 60% → 45% (to monthly) | −6% |
| Drop weekly (its payers go to monthly) | +3% |
| Store fee 15% → 30% | −18% |
| Refunds 4% → 10% | −6% |
| Yearly renewal 30% → 45% | 0% in year 1 (renewals fall after month 12); +4% on 24-month value per payer |

### Conversion × install growth (12-month net revenue, realistic mix and prices, US$)

| Conversion ↓ / install growth → | 5% | 10% | 15% | 20% | 25% |
|-------------------------------:|---:|----:|----:|----:|----:|
| 0.5% | 116 | 155 | 209 | 285 | 389 |
| 1.0% | 231 | 310 | 418 | 569 | 777 |
| **1.5%** | 347 | 464 | **628** | 854 | 1,166 |
| 2.0% | 462 | 619 | 837 | 1,139 | 1,555 |
| 3.0% | 694 | 929 | 1,255 | 1,708 | 2,332 |

### Retention view: what subscriber retention is worth (24-month net value per payer, US$)

| Yearly renewal ↓ / monthly months paid → | 2.0 | 3.5 | 5.0 |
|-----------------------------------------:|----:|----:|----:|
| 10% | 9.68 | 10.09 | 10.51 |
| 30% | 10.64 | **11.05** | 11.47 |
| 50% | 11.60 | 12.01 | 12.43 |

Moving renewal from 10% to 50% adds about 20% to value per payer. Moving conversion by 50% adds 50%. **Retention that matters first is user retention** (D1/D7 → more people reach the paywall and rate the app), not subscription renewal.

## 6. What has to be true

Steady-state installs per month for a given **net cash per month** (all plans, 24-month steady state):

| Net cash per month | Conservative | Realistic | Aggressive |
|-------------------:|-------------:|----------:|-----------:|
| $500 | 17,646 | 3,470 | 1,805 |
| $1,000 | 35,291 | 6,940 | 3,609 |
| $2,000 | 70,582 | 13,881 | 7,219 |
| $5,000 | 176,456 | 34,701 | 18,047 |

For **normalized MRR** (recurring only) of $500 / $1,000 / $2,000 under realistic assumptions: about 5,800 / 11,600 / 23,100 installs a month.

Today ~155 installs a month. The honest reading: **a monthly net income that replaces a job is not reachable on this audience and these prices without roughly 100× the traffic**, or a different, higher-priced offer. Realistic ambitions for the next two quarters:

| Horizon | Reasonable target | Why |
|---------|-------------------|-----|
| Day 30 | Purchase success >70%; crash-free >99% | Preconditions (no revenue target) |
| Day 60 | 500–1,000 installs a month, the first 5–10 payers, a New Year plan in place | Tests the funnel on real volume |
| Day 90 | 1,500–3,000 installs in the month of 1 January, 20–40 payers in the quarter, ~$150–400 net cash | Requires the New Year peak to materialize `[ASSUME]` |

## 7. Which metric has the greatest impact

Ranked by effect on 12-month revenue, per unit of plausible change:

1. **Install volume and growth** (a 5-point rise in monthly growth: +36%).
2. **Install-to-paid conversion**, which is mostly *purchase success* now (21% → 70% triples it) then *onboarding completion*.
3. **Price by country** (+35% vs current; the biggest lever that needs no traffic).
4. **Lifetime share** (+18%).
5. Store fee and refunds (−18% to −6%): second-order, partly outside control.
6. Subscriber retention: smallest of the group in the first 24 months.

If you can fix only one thing this month, fix **purchase success** (it multiplies everything below it); if you can do only one growth thing, do the **New Year ASO and content** push.

## 8. Costs and break-even (not modelled)

Fixed costs I can name from the repo and common pricing: Apple Developer Program ($99 a year), Google Play (one-time $25), Vercel and Firebase (free or low tiers; Cloud Functions need the Blaze plan), RevenueCat (free below a monthly tracked-revenue threshold — about $2,500 as I understand it, `[BENCH, verify]`), native reviewers for 2 languages, and your time. I do not know your actual spend, so break-even is `[MISSING]`.

## 9. How to update this model

1. Replace the base inputs in `BASE`/`SCENARIOS` with the RevenueCat conversion, mix, trial, refund and renewal numbers (B8).
2. Replace the prices with the real store prices per country (A6).
3. Replace month-1 installs and growth with the Play Console series (B6).
4. Re-run; compare the realistic row with the last three months of actual net revenue, and change the *assumptions*, not the conclusion.
