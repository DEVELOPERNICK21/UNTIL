/**
 * What the store says about a plan: expiry takes Premium away, a new plan queues one welcome,
 * and the plan record never names a product the app does not sell.
 */

const mockStore = new Map<string, string>();
jest.mock('../src/shared/persistence/mmkv', () => ({
  getString: (key: string) => mockStore.get(key),
  setString: (key: string, value: string) => void mockStore.set(key, value),
  remove: (key: string) => void mockStore.delete(key),
}));

import { MmkvPlanRecordStore } from '../src/features/premium/data/MmkvPlanRecordStore';
import { mapCustomerInfoToSyncPlan } from '../src/features/premium/domain/mapCustomerInfo';
import {
  dayPart,
  planFromEntitlement,
  planKindFromProductId,
  planTimeline,
} from '../src/features/premium/domain/plan';
import { SyncCustomerInfoUseCase } from '../src/features/premium/domain/useCases/SyncCustomerInfoUseCase';
import type { ISubscriptionRepository } from '../src/features/premium/domain/ports/ISubscriptionRepository';
import type {
  ActiveEntitlementDTO,
  CustomerInfoDTO,
  PlanRecord,
} from '../src/shared/types/purchases';
import { STORAGE_KEYS } from '../src/shared/persistence/schema';

const DAY = 86_400_000;

function entitlement(over: Partial<ActiveEntitlementDTO> = {}): ActiveEntitlementDTO {
  return {
    identifier: 'premium',
    productIdentifier: 'yearly_subscription',
    latestPurchaseDateMs: 1_000_000,
    expirationDateMs: 1_000_000 + 365 * DAY,
    willRenew: true,
    periodType: 'normal',
    store: 'play',
    billingIssueDetectedAtMs: null,
    ...over,
  };
}

const active = (e: ActiveEntitlementDTO): CustomerInfoDTO => ({
  activeEntitlements: [e],
  allPurchasedProductIds: [e.productIdentifier],
});
const ended: CustomerInfoDTO = {
  activeEntitlements: [],
  allPurchasedProductIds: ['yearly_subscription'],
  endedEntitlementIds: ['premium'],
};
const empty: CustomerInfoDTO = { activeEntitlements: [], allPurchasedProductIds: [] };

function fakeSubscription(seed: {
  isPremium?: boolean;
  licenseKey?: string | null;
  purchaseType?: 'weekly' | 'monthly' | 'yearly' | 'lifetime' | null;
} = {}) {
  const state = {
    isPremium: seed.isPremium ?? false,
    licenseKey: seed.licenseKey ?? null,
    purchaseType: seed.purchaseType ?? null,
    purchaseDate: null as number | null,
    purchaseToken: null as string | null,
  };
  const repo = {
    getIsPremium: () => state.isPremium,
    setIsPremium: (v: boolean) => void (state.isPremium = v),
    getLicenseKey: () => state.licenseKey,
    getPurchaseType: () => state.purchaseType,
    setPurchaseType: (v: typeof state.purchaseType) => void (state.purchaseType = v),
    getPurchaseDate: () => state.purchaseDate,
    setPurchaseDate: (v: number | null) => void (state.purchaseDate = v),
    getPurchaseToken: () => state.purchaseToken,
    setPurchaseToken: (v: string | null) => void (state.purchaseToken = v),
  } as unknown as ISubscriptionRepository;
  return { repo, state };
}

describe('plan kinds', () => {
  it('names every product the app sells, student apart from yearly', () => {
    expect(planKindFromProductId('weekly_subscription')).toBe('weekly');
    expect(planKindFromProductId('monthly_subscription')).toBe('monthly');
    expect(planKindFromProductId('yearly_subscription')).toBe('yearly');
    expect(planKindFromProductId('yearly_subscription_student')).toBe('student');
    expect(planKindFromProductId('lifetime_unlock')).toBe('lifetime');
  });

  it('reads a Play base-plan id as its product, and refuses a product it does not know', () => {
    expect(planKindFromProductId('yearly_subscription:yearly-default')).toBe('yearly');
    expect(planKindFromProductId('some_other_product')).toBeNull();
    expect(planFromEntitlement(entitlement({ productIdentifier: 'some_other_product' }))).toBeNull();
  });

  it('keeps the store, dates, trial and billing problem in the record', () => {
    const plan = planFromEntitlement(
      entitlement({ periodType: 'trial', billingIssueDetectedAtMs: 5 }),
    ) as PlanRecord;
    expect(plan).toMatchObject({
      kind: 'yearly',
      productId: 'yearly_subscription',
      store: 'play',
      startedMs: 1_000_000,
      willRenew: true,
      trial: true,
      billingIssue: true,
    });
  });

  it('never gives a lifetime plan an end or a renewal', () => {
    const plan = planFromEntitlement(
      entitlement({ productIdentifier: 'lifetime_unlock', expirationDateMs: 99, willRenew: true }),
    ) as PlanRecord;
    expect(plan.expiresMs).toBeNull();
    expect(plan.willRenew).toBe(false);
    expect(planTimeline(plan)).toEqual({ kind: 'forever' });
  });
});

describe('plan timeline', () => {
  const base = planFromEntitlement(entitlement()) as PlanRecord;

  it('says renews while it will renew, ends once it has been cancelled', () => {
    expect(planTimeline(base)).toEqual({ kind: 'renews', onMs: base.expiresMs });
    expect(planTimeline({ ...base, willRenew: false })).toEqual({ kind: 'ends', onMs: base.expiresMs });
  });

  it('says the trial ends, and says nothing it cannot back when the store gave no date', () => {
    expect(planTimeline({ ...base, trial: true })).toEqual({ kind: 'trialEnds', onMs: base.expiresMs });
    expect(planTimeline({ ...base, expiresMs: null })).toEqual({ kind: 'unknown' });
  });

  it('greets by the hour on the person’s clock', () => {
    expect([0, 4, 5, 11, 12, 17, 18, 23].map(dayPart)).toEqual([
      'evening', 'evening', 'morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening',
    ]);
  });
});

describe('expiry', () => {
  it('takes Premium away when RevenueCat says the entitlement has ended', () => {
    const plan = mapCustomerInfoToSyncPlan(ended, { hasLicenseKey: false, hasStorePurchase: true });
    expect(plan.setIsPremium).toBe(false);
    expect(plan.clearStorePurchaseFields).toBe(true);
    expect(plan.plan).toBeNull();
  });

  it('keeps a web license when the store plan has ended', () => {
    const plan = mapCustomerInfoToSyncPlan(ended, { hasLicenseKey: true, hasStorePurchase: true });
    expect(plan.setIsPremium).toBe(true);
    expect(plan.clearStorePurchaseFields).toBe(true);
  });

  it('does not take Premium away on an answer that is merely empty', () => {
    const plan = mapCustomerInfoToSyncPlan(empty, { hasLicenseKey: false, hasStorePurchase: true });
    expect(plan.setIsPremium).toBe(true);
    expect(plan.clearStorePurchaseFields).toBe(false);
    expect(plan.plan).toBeUndefined();
  });
});

describe('SyncCustomerInfoUseCase and the plan record', () => {
  let store: MmkvPlanRecordStore;
  beforeEach(() => {
    mockStore.clear();
    store = new MmkvPlanRecordStore();
  });

  it('records the plan and queues one welcome for a first purchase', () => {
    const { repo } = fakeSubscription();
    new SyncCustomerInfoUseCase(repo, undefined, store, () => 42).execute(active(entitlement()));
    expect(store.getPlan()?.kind).toBe('yearly');
    expect(store.getPlansBought()).toEqual(['yearly']);
    expect(store.getPendingWelcome()).toEqual({ kind: 'yearly', at: 42 });
  });

  it('does not greet again when the same info arrives twice (listener plus purchase)', () => {
    const { repo } = fakeSubscription();
    const uc = new SyncCustomerInfoUseCase(repo, undefined, store, () => 1);
    uc.execute(active(entitlement()));
    store.setPendingWelcome(null);
    uc.execute(active(entitlement()));
    expect(store.getPendingWelcome()).toBeNull();
  });

  it('does not greet a renewal', () => {
    const { repo } = fakeSubscription();
    const uc = new SyncCustomerInfoUseCase(repo, undefined, store);
    uc.execute(active(entitlement()));
    store.setPendingWelcome(null);
    uc.execute(active(entitlement({ latestPurchaseDateMs: 2_000_000, expirationDateMs: 2_000_000 + 365 * DAY })));
    expect(store.getPendingWelcome()).toBeNull();
    expect(store.getPlan()?.startedMs).toBe(2_000_000);
  });

  it('records an existing subscriber quietly: no welcome when the app already knew their purchase', () => {
    const { repo } = fakeSubscription({ isPremium: true, purchaseType: 'monthly' });
    new SyncCustomerInfoUseCase(repo, undefined, store).execute(
      active(entitlement({ productIdentifier: 'monthly_subscription' })),
    );
    expect(store.getPlan()?.kind).toBe('monthly');
    expect(store.getPlansBought()).toEqual(['monthly']);
    expect(store.getPendingWelcome()).toBeNull();
  });

  it('greets a switch to another plan', () => {
    const { repo } = fakeSubscription();
    const uc = new SyncCustomerInfoUseCase(repo, undefined, store, () => 7);
    uc.execute(active(entitlement({ productIdentifier: 'weekly_subscription' })));
    store.setPendingWelcome(null);
    uc.execute(active(entitlement()));
    expect(store.getPendingWelcome()).toEqual({ kind: 'yearly', at: 7 });
    expect(store.getPlansBought()).toEqual(['weekly', 'yearly']);
  });

  it('clears the plan and Premium at expiry but remembers what was bought', () => {
    const { repo, state } = fakeSubscription();
    const uc = new SyncCustomerInfoUseCase(repo, undefined, store);
    uc.execute(active(entitlement()));
    uc.execute(ended);
    expect(state.isPremium).toBe(false);
    expect(state.purchaseType).toBeNull();
    expect(store.getPlan()).toBeNull();
    expect(store.getPlansBought()).toEqual(['yearly']);
  });

  it('greets again when someone comes back after an expiry', () => {
    const { repo } = fakeSubscription();
    const uc = new SyncCustomerInfoUseCase(repo, undefined, store, () => 9);
    uc.execute(active(entitlement()));
    uc.execute(ended);
    store.setPendingWelcome(null);
    uc.execute(active(entitlement({ latestPurchaseDateMs: 5_000_000 })));
    expect(store.getPendingWelcome()).toEqual({ kind: 'yearly', at: 9 });
  });

  it('works without a plan store, as before', () => {
    const { repo, state } = fakeSubscription();
    new SyncCustomerInfoUseCase(repo).execute(active(entitlement()));
    expect(state.isPremium).toBe(true);
    expect(state.purchaseType).toBe('yearly');
  });
});

describe('MmkvPlanRecordStore', () => {
  it('reads damaged data as nothing recorded', () => {
    const store = new MmkvPlanRecordStore();
    mockStore.set(STORAGE_KEYS.PREMIUM_PLAN, '{not json');
    mockStore.set(STORAGE_KEYS.PREMIUM_PLANS_BOUGHT, '"yearly"');
    mockStore.set(STORAGE_KEYS.PREMIUM_WELCOME_PENDING, '{"kind":"nope","at":1}');
    expect(store.getPlan()).toBeNull();
    expect(store.getPlansBought()).toEqual([]);
    expect(store.getPendingWelcome()).toBeNull();
  });

  it('tells subscribers when something changes', () => {
    mockStore.clear();
    const store = new MmkvPlanRecordStore();
    const listener = jest.fn();
    const off = store.subscribe(listener);
    store.addPlanBought('lifetime');
    store.addPlanBought('lifetime');
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    store.setPendingWelcome({ kind: 'lifetime', at: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
