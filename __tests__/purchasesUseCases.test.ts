import { PurchaseCancelledError } from '../src/domain/errors/purchasesErrors';
import type { IPurchasesRepository } from '../src/domain/repository/IPurchasesRepository';
import type { ISubscriptionRepository } from '../src/domain/repository/ISubscriptionRepository';
import { GetOfferingsUseCase } from '../src/domain/useCases/GetOfferingsUseCase';
import { IdentifyPurchasesUserUseCase } from '../src/domain/useCases/IdentifyPurchasesUserUseCase';
import { PurchasePackageUseCase } from '../src/domain/useCases/PurchasePackageUseCase';
import { ResetPurchasesUserUseCase } from '../src/domain/useCases/ResetPurchasesUserUseCase';
import { RestorePurchasesUseCase } from '../src/domain/useCases/RestorePurchasesUseCase';
import { SyncCustomerInfoUseCase } from '../src/domain/useCases/SyncCustomerInfoUseCase';
import type { CustomerInfoDTO, PurchasesOfferingDTO } from '../src/types/purchases';
import type { PurchaseType, SubscriptionState } from '../src/types';

function fakeSub(seed: Partial<{
  isPremium: boolean;
  licenseKey: string | null;
  purchaseType: PurchaseType | null;
}> = {}): ISubscriptionRepository & { state: { isPremium: boolean } } {
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

const premiumInfo: CustomerInfoDTO = {
  activeEntitlements: [{
    identifier: 'premium',
    productIdentifier: 'yearly_subscription',
    latestPurchaseDateMs: 1_000,
    expirationDateMs: null,
    willRenew: true,
  }],
  allPurchasedProductIds: ['yearly_subscription'],
};

const emptyInfo: CustomerInfoDTO = {
  activeEntitlements: [],
  allPurchasedProductIds: [],
};

class FakePurchases implements IPurchasesRepository {
  offerings: PurchasesOfferingDTO | null = null;
  customerInfo: CustomerInfoDTO = emptyInfo;
  purchaseError: unknown = null;
  purchasedProductId: string | null = null;
  loggedInUid: string | null = null;
  loggedOut = false;
  restoreCount = 0;

  configure() {}
  setDebugLogs() {}
  async getOfferings() {
    return this.offerings;
  }
  async purchaseProductId(productId: string) {
    if (this.purchaseError != null) throw this.purchaseError;
    this.purchasedProductId = productId;
    return this.customerInfo;
  }
  async restorePurchases() {
    this.restoreCount += 1;
    return this.customerInfo;
  }
  async getCustomerInfo() {
    return this.customerInfo;
  }
  addCustomerInfoListener() {
    return () => {};
  }
  async logIn(appUserId: string) {
    this.loggedInUid = appUserId;
    return this.customerInfo;
  }
  async logOut() {
    this.loggedOut = true;
    return this.customerInfo;
  }
}

describe('GetOfferingsUseCase', () => {
  it('returns the current offering from purchases', async () => {
    const purchases = new FakePurchases();
    purchases.offerings = {
      identifier: 'default',
      packages: [{
        identifier: '$rc_annual',
        productId: 'yearly_subscription',
        title: 'Yearly',
        description: '',
        priceString: '$29.99',
      }],
    };
    const result = await new GetOfferingsUseCase(purchases).execute();
    expect(result?.identifier).toBe('default');
    expect(result?.packages).toHaveLength(1);
  });

  it('returns null when there is no current offering', async () => {
    const result = await new GetOfferingsUseCase(new FakePurchases()).execute();
    expect(result).toBeNull();
  });
});

describe('PurchasePackageUseCase', () => {
  it('syncs customer info and returns purchased', async () => {
    const purchases = new FakePurchases();
    purchases.customerInfo = premiumInfo;
    const sub = fakeSub();
    const onApplied = jest.fn();
    const sync = new SyncCustomerInfoUseCase(sub, onApplied);
    const result = await new PurchasePackageUseCase(purchases, sync).execute(
      'yearly_subscription',
    );
    expect(result).toEqual({ status: 'purchased' });
    expect(purchases.purchasedProductId).toBe('yearly_subscription');
    expect(sub.getIsPremium()).toBe(true);
    expect(sub.getPurchaseType()).toBe('yearly');
    expect(onApplied).toHaveBeenCalledTimes(1);
  });

  it('maps PurchaseCancelledError to cancelled without syncing', async () => {
    const purchases = new FakePurchases();
    purchases.purchaseError = new PurchaseCancelledError();
    const sub = fakeSub();
    const onApplied = jest.fn();
    const result = await new PurchasePackageUseCase(
      purchases,
      new SyncCustomerInfoUseCase(sub, onApplied),
    ).execute('yearly_subscription');
    expect(result).toEqual({ status: 'cancelled' });
    expect(sub.getIsPremium()).toBe(false);
    expect(onApplied).not.toHaveBeenCalled();
  });

  it('maps userCancelled flag to cancelled', async () => {
    const purchases = new FakePurchases();
    purchases.purchaseError = { userCancelled: true, code: 1 };
    const result = await new PurchasePackageUseCase(
      purchases,
      new SyncCustomerInfoUseCase(fakeSub()),
    ).execute('monthly_subscription');
    expect(result).toEqual({ status: 'cancelled' });
  });

  it('returns error message for other failures', async () => {
    const purchases = new FakePurchases();
    purchases.purchaseError = new Error('Store unavailable');
    const result = await new PurchasePackageUseCase(
      purchases,
      new SyncCustomerInfoUseCase(fakeSub()),
    ).execute('yearly_subscription');
    expect(result).toEqual({ status: 'error', message: 'Store unavailable' });
  });
});

describe('RestorePurchasesUseCase', () => {
  it('syncs and reports restored when premium is active', async () => {
    const purchases = new FakePurchases();
    purchases.customerInfo = premiumInfo;
    const sub = fakeSub();
    const onApplied = jest.fn();
    const result = await new RestorePurchasesUseCase(
      purchases,
      new SyncCustomerInfoUseCase(sub, onApplied),
    ).execute();
    expect(result).toEqual({ restored: true });
    expect(purchases.restoreCount).toBe(1);
    expect(sub.getIsPremium()).toBe(true);
    expect(onApplied).toHaveBeenCalledTimes(1);
  });

  it('syncs and reports not restored when premium is absent', async () => {
    const purchases = new FakePurchases();
    const sub = fakeSub({ isPremium: true });
    const result = await new RestorePurchasesUseCase(
      purchases,
      new SyncCustomerInfoUseCase(sub),
    ).execute();
    expect(result).toEqual({ restored: false });
    expect(sub.getIsPremium()).toBe(false);
  });
});

describe('IdentifyPurchasesUserUseCase', () => {
  it('logs in then syncs customer info', async () => {
    const purchases = new FakePurchases();
    purchases.customerInfo = premiumInfo;
    const sub = fakeSub();
    const onApplied = jest.fn();
    await new IdentifyPurchasesUserUseCase(
      purchases,
      new SyncCustomerInfoUseCase(sub, onApplied),
    ).execute('uid-1');
    expect(purchases.loggedInUid).toBe('uid-1');
    expect(sub.getIsPremium()).toBe(true);
    expect(onApplied).toHaveBeenCalledTimes(1);
  });
});

describe('ResetPurchasesUserUseCase', () => {
  it('logs out then syncs, keeping license premium', async () => {
    const purchases = new FakePurchases();
    purchases.customerInfo = emptyInfo;
    const sub = fakeSub({ isPremium: true, licenseKey: 'KEY' });
    const onApplied = jest.fn();
    await new ResetPurchasesUserUseCase(
      purchases,
      new SyncCustomerInfoUseCase(sub, onApplied),
    ).execute();
    expect(purchases.loggedOut).toBe(true);
    expect(sub.getIsPremium()).toBe(true);
    expect(sub.getPurchaseType()).toBe(null);
    expect(onApplied).toHaveBeenCalledTimes(1);
  });

  it('logs out then syncs, keeping store purchaseType when RC is empty', async () => {
    const purchases = new FakePurchases();
    purchases.customerInfo = emptyInfo;
    const sub = fakeSub({ isPremium: true, purchaseType: 'yearly' });
    await new ResetPurchasesUserUseCase(
      purchases,
      new SyncCustomerInfoUseCase(sub),
    ).execute();
    expect(purchases.loggedOut).toBe(true);
    expect(sub.getIsPremium()).toBe(true);
    expect(sub.getPurchaseType()).toBe('yearly');
  });
});
