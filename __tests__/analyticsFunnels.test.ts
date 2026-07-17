import {
  getOnboardingStepCount,
  getOnboardingStepIndex,
  onboardingStepViewProps,
  ONBOARDING_FUNNEL_ANALYTICS_ORDER,
} from '../src/config/analyticsFunnels';

describe('analyticsFunnels', () => {
  it('assigns stable step indexes for PostHog funnels', () => {
    expect(getOnboardingStepIndex('brand')).toBe(0);
    expect(getOnboardingStepIndex('paywall')).toBe(
      getOnboardingStepCount() - 1
    );
    expect(onboardingStepViewProps('q_goal')).toEqual({
      step: 'q_goal',
      step_index: 3,
      step_count: getOnboardingStepCount(),
    });
  });

  it('keeps funnel order aligned with quiz steps', () => {
    expect(ONBOARDING_FUNNEL_ANALYTICS_ORDER[0]).toBe('brand');
    expect(ONBOARDING_FUNNEL_ANALYTICS_ORDER).toContain('results');
    expect(ONBOARDING_FUNNEL_ANALYTICS_ORDER).toContain('paywall');
  });
});
