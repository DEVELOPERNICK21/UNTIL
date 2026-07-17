import {
  formatPaywallSocialProof,
  MONETIZATION_PRICING,
} from '../src/config/monetization';

describe('monetization pricing', () => {
  it('matches live Play Store pricing', () => {
    expect(MONETIZATION_PRICING.monthlyInr).toBe(100);
    expect(MONETIZATION_PRICING.yearlyInr).toBe(500);
    expect(MONETIZATION_PRICING.lifetimeInr).toBe(1500);
    expect(MONETIZATION_PRICING.yearlyStudentInr).toBe(500);
    expect(MONETIZATION_PRICING.yearlySavingsVsMonthlyDisplay).toBe('₹700');
  });

  it('hides social proof when count is unverified', () => {
    expect(formatPaywallSocialProof(null)).toBeNull();
    expect(formatPaywallSocialProof(0)).toBeNull();
  });

  it('formats verified social proof without inventing digits', () => {
    expect(formatPaywallSocialProof(14200)).toBe(
      'Join 14,200+ people watching their life'
    );
  });
});
