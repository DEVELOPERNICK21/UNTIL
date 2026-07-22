import {
  AUTO_REVIEW_COOLDOWN_MS,
  isAutoReviewCooldownElapsed,
  isSustainedUseEligible,
  daysBetweenDateKeys,
} from '../src/core/engagement';

describe('inAppReviewEligibility', () => {
  it('allows auto when never asked', () => {
    expect(isAutoReviewCooldownElapsed(null, 1_000_000)).toBe(true);
  });

  it('blocks auto within 90 days', () => {
    const now = 1_000_000_000_000;
    expect(
      isAutoReviewCooldownElapsed(now - AUTO_REVIEW_COOLDOWN_MS + 1, now)
    ).toBe(false);
  });

  it('allows auto after 90 days', () => {
    const now = 1_000_000_000_000;
    expect(
      isAutoReviewCooldownElapsed(now - AUTO_REVIEW_COOLDOWN_MS, now)
    ).toBe(true);
  });

  it('daysBetweenDateKeys is calendar-local', () => {
    expect(daysBetweenDateKeys('2026-07-01', '2026-07-04')).toBe(3);
    expect(daysBetweenDateKeys('2026-07-04', '2026-07-04')).toBe(0);
  });

  it('sustained use needs opens + days', () => {
    expect(isSustainedUseEligible(5, '2026-07-01', '2026-07-04')).toBe(true);
    expect(isSustainedUseEligible(4, '2026-07-01', '2026-07-10')).toBe(false);
    expect(isSustainedUseEligible(5, '2026-07-03', '2026-07-04')).toBe(false);
    expect(isSustainedUseEligible(5, null, '2026-07-04')).toBe(false);
  });
});
