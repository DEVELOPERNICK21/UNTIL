# Onboarding funnel analytics (PostHog)

Use event `onboarding_step_view` with properties:

| Property | Type | Notes |
|----------|------|--------|
| `step` | string | Funnel step id (`brand`, `q_goal`, … `paywall`) |
| `step_index` | number | 0-based order (stable across releases) |
| `step_count` | number | Total steps in `ONBOARDING_FUNNEL_STEPS` |

## Recommended PostHog insight

1. Insights → **Funnel**
2. Steps: series of `onboarding_step_view` filtered by `step` (or ordered by `step_index`)
3. Order (from `src/config/analyticsFunnels.ts`):

`brand` → `day_demo` → `widgets_demo` → `q_goal` → `q_drain` → `interstitial` → `identity` → `life_weeks` → `q_values` → `q_cadence` → `q_readiness` → `loader` → `results` → `paywall`

4. Conversion goal: `onboarding_paywall_seen` or purchase events after paywall

Also useful:

- `onboarding_answer` — quiz answers by step
- `onboarding_results_view` — results card engagement
- `onboarding_life_aha` — life weeks preview
- `onboarding_complete` — finished onboarding

SSOT for step order: `src/core/onboarding/quizFunnel.ts` → `ONBOARDING_FUNNEL_STEPS`.
