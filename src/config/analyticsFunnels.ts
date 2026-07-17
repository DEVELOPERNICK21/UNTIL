/**
 * Onboarding funnel analytics helpers — step index for PostHog funnels.
 */

import { ONBOARDING_FUNNEL_STEPS } from '../core/onboarding/quizFunnel';
import type { OnboardingFunnelStep } from '../types';

export function getOnboardingStepIndex(step: OnboardingFunnelStep): number {
  const idx = ONBOARDING_FUNNEL_STEPS.indexOf(step);
  return idx < 0 ? -1 : idx;
}

export function getOnboardingStepCount(): number {
  return ONBOARDING_FUNNEL_STEPS.length;
}

/** Props for `onboarding_step_view` — keeps PostHog funnel definitions stable. */
export function onboardingStepViewProps(step: OnboardingFunnelStep): {
  step: OnboardingFunnelStep;
  step_index: number;
  step_count: number;
} {
  return {
    step,
    step_index: getOnboardingStepIndex(step),
    step_count: getOnboardingStepCount(),
  };
}

/**
 * Ordered steps for a PostHog funnel insight (drop-off by quiz step).
 * Build: Insights → Funnel → these events with step property matching.
 */
export const ONBOARDING_FUNNEL_ANALYTICS_ORDER: readonly OnboardingFunnelStep[] =
  ONBOARDING_FUNNEL_STEPS;
