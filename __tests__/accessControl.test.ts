import {
  computeAccessState,
  hasPremiumBundle,
  canAccessLife,
  TRIAL_DURATION_MS,
  LIFE_EVENT_UNLOCK_MS,
} from '../src/domain/accessControl';

describe('accessControl', () => {
  it('trial active within 14 days from start', () => {
    const now = 10_000_000;
    const access = computeAccessState({
      now,
      isPremium: false,
      purchaseType: null,
      purchaseDate: null,
      trialStartDate: now - 1000,
      appOpenCount: 0,
      lifeScreenViewed: false,
      lifeUnlockUntil: null,
    });
    expect(access.trialActive).toBe(true);
    expect(hasPremiumBundle(access)).toBe(true);
  });

  it('trial inactive after 14 days', () => {
    const now = 10_000_000;
    const access = computeAccessState({
      now,
      isPremium: false,
      purchaseType: null,
      purchaseDate: null,
      trialStartDate: now - TRIAL_DURATION_MS - 1,
      appOpenCount: 0,
      lifeScreenViewed: false,
      lifeUnlockUntil: null,
    });
    expect(access.trialActive).toBe(false);
    expect(hasPremiumBundle(access)).toBe(false);
  });

  it('premium overrides trial', () => {
    const now = 10_000_000;
    const access = computeAccessState({
      now,
      isPremium: true,
      purchaseType: 'yearly',
      purchaseDate: now,
      trialStartDate: now - TRIAL_DURATION_MS - 1,
      appOpenCount: 0,
      lifeScreenViewed: false,
      lifeUnlockUntil: null,
    });
    expect(access.isPremium).toBe(true);
    expect(hasPremiumBundle(access)).toBe(true);
  });

  it('life event unlock window', () => {
    const now = 5_000_000;
    const access = computeAccessState({
      now,
      isPremium: false,
      purchaseType: null,
      purchaseDate: null,
      trialStartDate: null,
      appOpenCount: 0,
      lifeScreenViewed: false,
      lifeUnlockUntil: now + LIFE_EVENT_UNLOCK_MS,
    });
    expect(access.lifeEventUnlockActive).toBe(true);
    expect(canAccessLife(access)).toBe(true);
    expect(hasPremiumBundle(access)).toBe(false);
  });
});
