import {
  formatPaywallSocialProof,
  MONETIZATION_PRICING,
} from '../src/config/monetization';

describe('monetization pricing', () => {
  it('matches approved INR ladder', () => {
    expect(MONETIZATION_PRICING.weeklyInr).toBe(49);
    expect(MONETIZATION_PRICING.monthlyInr).toBe(149);
    expect(MONETIZATION_PRICING.yearlyInr).toBe(499);
    expect(MONETIZATION_PRICING.lifetimeInr).toBe(1999);
    expect(MONETIZATION_PRICING.yearlyStudentInr).toBe(249);
    expect(MONETIZATION_PRICING.yearlySavingsVsMonthlyDisplay).toBe('₹1,289');
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
