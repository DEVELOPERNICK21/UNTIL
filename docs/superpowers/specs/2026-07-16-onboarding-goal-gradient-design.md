# Onboarding — Goal Gradient progress + encouragement

**Date:** 2026-07-16  
**Status:** Approved design  
**Approach:** #2 — head start + late acceleration + stage encouragement (no % badge, no stepper)

## Goal

Apply the **Goal Gradient Effect** to the quiz funnel progress UI so the first progress screen does not feel like a cold 0% start, and late steps feel close to done — increasing completion without changing funnel length, pricing, or trial.

## Non-goals

- Labeled milestone stepper (Sign up / Profile / …)
- Loud gamified badge like “20% 🔥”
- Changing step order, step count, or paywall/trial behavior
- Emoji-heavy copy that fights UNTIL’s calm tone

## Context

Today `getFunnelProgress` is linear: `(idx + 1) / ONBOARDING_PROGRESS_STEPS.length` (~8% on `day_demo`). Brand and paywall hide the bar. Goal gradient research and high-converting quiz funnels use a **head start** plus **near-finish acceleration**, plus short encouraging copy under the bar.

## Decisions

| Topic | Choice |
|-------|--------|
| Scope | Progress curve + encouragement line under existing thin bar |
| Head start | ~18% on first progress step (`day_demo`) |
| Late ramp | ~95% on `loader`, 100% on `results` |
| Percent label | Yes — show beside encouragement (`· 18% complete`) in ember accent |
| Copy tone | Calm captions, no emoji spam |
| Logic home | Pure helpers in `src/core/onboarding/quizFunnel.ts` |
| UI home | `FunnelProgressBar` (+ wire from `OnboardingScreen`) |

## Progress curve

Map each `ONBOARDING_PROGRESS_STEPS` index to a display progress in `[0.18, 1]`, with mid ~0.55–0.68 around identity/life_weeks and late acceleration into loader/results.

| Stage | Steps | Displayed progress (approx) |
|-------|--------|-----------------------------|
| Head start | `day_demo`, `widgets_demo` | ~18% → ~28% |
| Building | `q_goal` → `interstitial` | ~35% → ~48% |
| Map forming | `identity`, `life_weeks` | ~55% → ~68% |
| Closing in | `q_values` → `q_readiness` | ~75% → ~88% |
| Almost there | `loader`, `results` | ~95% → 100% |

- Brand / paywall: still return `0` and hide the bar (unchanged).
- Values must be **monotone non-decreasing** as the user advances.
- Prefer an explicit step→progress table or a small easing function over opaque magic numbers scattered in UI.

## Encouragement copy + percent

Shown as a secondary caption under the progress track when the bar is visible.

Format: `{encouragement} · {N}% complete` (percent in ember/accent color).

| Stage | Steps (inclusive) | Line |
|-------|-------------------|------|
| Early | `day_demo` … `q_drain` | You’re underway |
| Mid | `interstitial` … `life_weeks` | Your time map is forming |
| Late | `q_values` … `q_readiness` | Almost ready |
| Final | `loader`, `results` | Your plan is ready |

Example on first progress step: `You're underway · 18% complete`.

Optional light fade when the stage string changes (reuse existing onboarding motion patterns; no new animation library).

## File touch list

1. `src/core/onboarding/quizFunnel.ts` — `getFunnelProgress` curve; `getFunnelEncouragement(step)` (or equivalent)
2. `src/core/onboarding/index.ts` — export new helper if needed
3. `src/surfaces/onboarding/FunnelProgressBar.tsx` — optional `encouragement` prop; render caption under track
4. `src/surfaces/onboarding/OnboardingScreen.tsx` — pass encouragement from hook/core
5. `src/hooks/useOnboardingFunnel.ts` — expose encouragement if progress already flows through the hook
6. `__tests__/onboardingQuizFunnel.test.ts` — update progress expectations; assert encouragement stages

## Success criteria

- First visible bar step reads clearly past empty (≈18%), not ~8%
- Progress never decreases when moving forward
- Encouragement updates by stage and stays calm
- Existing funnel navigation and analytics unchanged
- Unit tests cover progress + encouragement mapping

## Out of scope for follow-ups

- Stepper milestones (approach C)
- Social proof / paywall changes
- Native trial migration
