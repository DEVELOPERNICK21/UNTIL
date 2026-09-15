import { SyncCustomerInfoUseCase } from '../src/domain/useCases/SyncCustomerInfoUseCase';
import type { ISubscriptionRepository } from '../src/domain/repository/ISubscriptionRepository';
import type { PurchaseType, SubscriptionState } from '../src/types';

function fakeSub(seed: Partial<{
  isPremium: boolean;
  licenseKey: string | null;
  purchaseType: PurchaseType | null;
}> = {}): ISubscriptionRepository & { state: any } {
  const state = {
    isPremium: seed.isPremium ?? false,
    licenseKey: seed.licenseKey ?? null,
    purchaseType: seed.purchaseType ?? null,
    purchaseDate: null as number | null,
    purchaseToken: null as string | null,
  };
  return {
    state,
    getIsPremium: () => state.isPremium,
    setIsPremium: v => { state.isPremium = v; },
    getLicenseKey: () => state.licenseKey,
    setLicenseKey: k => { state.licenseKey = k; },
    getDeviceId: () => null,
    setDeviceId: () => {},
    getLastVerifiedAt: () => null,
    setLastVerifiedAt: () => {},
    getPurchaseType: () => state.purchaseType,
    setPurchaseType: v => { state.purchaseType = v; },
    getPurchaseDate: () => state.purchaseDate,
    setPurchaseDate: v => { state.purchaseDate = v; },
    getPurchaseToken: () => state.purchaseToken,
    setPurchaseToken: v => { state.purchaseToken = v; },
    getTrialStartDate: () => null,
    setTrialStartDate: () => {},
    getAppOpenCount: () => 0,
    setAppOpenCount: () => {},
    incrementAppOpenCount: () => 0,
    getLifeScreenViewed: () => false,
    setLifeScreenViewed: () => {},
    getLifeUnlockUntil: () => null,
    setLifeUnlockUntil: () => {},
    getState: () => ({}) as SubscriptionState,
    subscribe: () => () => {},
  };
}

describe('SyncCustomerInfoUseCase', () => {
  it('sets premium from entitlement', () => {
    const sub = fakeSub();
    const uc = new SyncCustomerInfoUseCase(sub);
    uc.execute({
      activeEntitlements: [{
        identifier: 'premium',
        productIdentifier: 'monthly_subscription',
        latestPurchaseDateMs: 50,
        expirationDateMs: null,
        willRenew: true,
      }],
      allPurchasedProductIds: ['monthly_subscription'],
    });
    expect(sub.getIsPremium()).toBe(true);
    expect(sub.getPurchaseType()).toBe('monthly');
  });

  it('does not clear premium when license exists and RC empty', () => {
    const sub = fakeSub({ isPremium: true, licenseKey: 'KEY' });
    const uc = new SyncCustomerInfoUseCase(sub);
    uc.execute({ activeEntitlements: [], allPurchasedProductIds: [] });
    expect(sub.getIsPremium()).toBe(true);
    expect(sub.getPurchaseType()).toBe(null);
  });

  it('keeps premium and purchaseType when empty RC has existing store purchase', () => {
    const sub = fakeSub({
      isPremium: true,
      purchaseType: 'yearly',
    });
    sub.state.purchaseDate = 1_700_000_000_000;
    sub.state.purchaseToken = 'store-token';
    const uc = new SyncCustomerInfoUseCase(sub);
    uc.execute({ activeEntitlements: [], allPurchasedProductIds: [] });
    expect(sub.getIsPremium()).toBe(true);
    expect(sub.getPurchaseType()).toBe('yearly');
    expect(sub.getPurchaseDate()).toBe(1_700_000_000_000);
    expect(sub.getPurchaseToken()).toBe('store-token');
  });
});
