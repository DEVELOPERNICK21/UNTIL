import {
  markDeferredPaywallShown,
  shouldShowDeferredPaywall,
} from '../src/features/premium/services/deferredPaywall';
import type { AccessState } from '../src/shared/types';

const mockStore = new Map<string, string>();
jest.mock('../src/shared/persistence/mmkv', () => ({
  getString: (key: string) => mockStore.get(key),
  setString: (key: string, value: string) => {
    mockStore.set(key, value);
  },
}));

const access = (over: Partial<AccessState>): AccessState =>
  ({ isPremium: false, appOpenCount: 2, ...over }) as AccessState;

describe('deferred paywall', () => {
  beforeEach(() => mockStore.clear());

  it('is due from the second open for someone who has not subscribed', () => {
    expect(shouldShowDeferredPaywall(access({ appOpenCount: 1 }))).toBe(false);
    expect(shouldShowDeferredPaywall(access({ appOpenCount: 2 }))).toBe(true);
  });

  it('never shows to a subscriber', () => {
    expect(shouldShowDeferredPaywall(access({ isPremium: true }))).toBe(false);
  });

  it('stays off once any paywall was marked as shown (the onboarding paywall does this)', () => {
    markDeferredPaywallShown();
    expect(shouldShowDeferredPaywall(access({ appOpenCount: 10 }))).toBe(false);
  });
});
