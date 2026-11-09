# Code proposal #1 — paywall prices, one paywall, honest events (APPLIED 2026-11-05)

Status: **applied to the app on 2026-11-05 after approval; not yet run on a device.** It was prepared and tested in a scratch copy first. The change is [code-proposal-1.patch](code-proposal-1.patch) (18 source files + 8 test files, +730 / −94 lines). Implements quick wins Q1–Q4 from [05](../05-conversion-optimization-plan.md) and gaps 2, 8 and the restore events from [04](../04-analytics-tracking-plan.md).

Applied with this command (from the repo root; the folder is not a git repo, so there is no commit; to undo, run it with `-R`, which works only while those files have not been edited since):

```bash
git apply --check -p1 docs/business-audit/proposals/code-proposal-1.patch && git apply -p1 docs/business-audit/proposals/code-proposal-1.patch
# undo: git apply -R -p1 docs/business-audit/proposals/code-proposal-1.patch
```

## What changes, and what a user sees

| # | Change | Before → after |
|---|--------|----------------|
| 1 | **Paywall figures come from the store's numbers** (`paywallMoney.ts`, `usePaywallPrices.ts`, `paywallPlans.ts`). The DTO now carries the store's numeric `price` and `currencyCode`. | Beside a `$14.99` price a US user saw "Less than ₹1.37/day", a struck-through "₹1,788/year" and "Save ₹1,289". Now: "Less than $0.05/day", "$35.88/year" struck through, "Save 58%". India still gets ₹1.37, ₹1,788 and "Save 72%". Lines are left out if the store gave no number. The two hard-coded INR constants and their test assertion are deleted. Locale files are untouched ("Save {{amount}}" now receives a percentage). |
| 2 | **One unprompted paywall.** `OnboardingPaywallScreen` calls `markDeferredPaywallShown()` when it appears. | The deferred paywall no longer follows the onboarding paywall on the 2nd open. It still exists for people who reached Home without seeing the onboarding paywall. |
| 3 | **Faster first run.** Splash 1000 → 500 ms; onboarding loader beat 2600 → 700 ms. | About 2.4 s less waiting. The loader step is kept (shortened, not removed): removing it changes the step list that saved onboarding state, `step_count` analytics and tests depend on. |
| 4 | **Funnel events.** New `paywall_shown`, `paywall_plan_selected`, `paywall_dismissed` (with `seconds_open`), `premium_restore_empty`, `premium_restore_failed`. `premium_purchase_completed` gains numeric `value`, `currency`, `period`. The dead `onboarding_step` name is removed. | Revenue can now be summed in Firebase/PostHog for purchases made on the custom paywall. Existing events (`premium_viewed`, `onboarding_paywall_seen`, …) are unchanged so history stays comparable. |

Also: the plan-card selection type error in `PremiumPaywallBody.tsx` (`useState<string>`) is fixed, and its two near-identical purchase-failure blocks became one helper, which is what keeps that file under its test-enforced line cap (786 → 757).

## What this does **not** fix (be aware)

- **Purchases made on the RevenueCat dashboard paywall (the main surface) still log no `premium_purchase_completed`** — only `onboarding_paywall_result: purchased`. No value is available there without a `customerInfo` listener event (proposal #2) or the RevenueCat → Firebase/PostHog integrations. Do the integrations regardless.
- **`paywall_shown` for the RevenueCat paywall is logged when it closes.** The SDK's `presentPaywall` has no on-screen callback, so counts are right but timestamps are the close. (Doc 04 said "RC SDK callback"; corrected.)
- Fallback prices shown when offerings fail to load are still rupees for everyone (plans cannot be bought in that state; unchanged).
- The deferred paywall's "dismissed → open custom Premium screen" fall-through is unchanged.
- Session-based gating and `widget_inventory` are in [proposal #2](code-proposal-2.md). The "Life is free on both watches, Premium on the phone" mismatch is a product decision (which side changes), not part of either proposal.

## Judgement calls to confirm

1. **Deferred paywall effectively off for onboarded users.** Fewer paywall exposures is the point (the written rule is one interstitial per session), but it also removes a second chance to convert. At ~5 installs a day the effect is too small to measure either way; the alternative is a minimum gap of N days instead of "never".
2. **Splash 500 / loader 700 ms** are my picks, not measured. Anything from 0 to ~1 s is defensible.

## How it was checked (scratch copy; not on a device)

| Check | Result |
|-------|--------|
| Full jest suite, before | 97 of 98 suites pass (812 tests). The one failure, `desktopStandards`, fails only because the scratch copy omits `desktop/src-tauri`. |
| Full jest suite, after | 102 of 103 suites pass (**835** tests, +23); same single scratch-only failure. `architecture.test.ts` (line-cap ratchet, layer rules) passes. |
| `tsc --noEmit` | 76 errors before, 75 after; **no new errors** (the one removed is the pre-existing `useState` literal-type error). Remaining ones are pre-existing (`process` types, `Slider`). |
| eslint on changed folders | 0 errors; +5 `no-void` warnings, the same `void logAnalyticsEvent(...)` style used across the codebase. |
| Patch | Applied to a fresh copy and compared byte-for-byte with the tested tree; `git apply --check` passes against the real tree. |

After applying, in the real tree: full jest **103 of 103 suites, 854 tests pass**; `tsc` shows 4 errors in `src/` and `__tests__/`, all in files the patch does not touch (`Slider.tsx`, `verifySubscriptionLicenseOrStore.test.ts`); the tree matches the tested scratch copy byte for byte.

**Not verified:** how Hermes formats `Intl.NumberFormat` currency/percent on a real Android and iOS device (verified on Node: `₹499.00`, `$0.05`, `¥7`, `72 %` in German). Check the paywall once on an Android build in en/de/hi with a non-INR Play test account before shipping, and confirm in the Firebase DebugView that `paywall_shown`, `paywall_plan_selected` and `value`/`currency` arrive.

## Caveat on this working tree

`.worktrees/` holds eight other copies of the app (`crash-fixes`, `integrate-2`, `premium-multi`, …) that differ from the main tree in files this patch touches (`PremiumPaywallBody.tsx`, `OnboardingPaywallScreen.tsx`, `monetization.ts`, `analytics.ts`, …). This patch is against the main tree only; if one of those branches is meant to merge later, expect conflicts in those files.
