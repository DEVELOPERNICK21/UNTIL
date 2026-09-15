import { mapCustomerInfoToSyncPlan } from '../src/domain/billing/mapCustomerInfo';

describe('mapCustomerInfoToSyncPlan', () => {
  it('grants premium when premium entitlement active', () => {
    const plan = mapCustomerInfoToSyncPlan(
      {
        activeEntitlements: [
          {
            identifier: 'premium',
            productIdentifier: 'yearly_subscription',
            latestPurchaseDateMs: 1_000,
            expirationDateMs: null,
            willRenew: true,
          },
        ],
        allPurchasedProductIds: ['yearly_subscription'],
      },
      { hasLicenseKey: false }
    );
    expect(plan.setIsPremium).toBe(true);
    expect(plan.purchaseType).toBe('yearly');
    expect(plan.purchaseDateMs).toBe(1_000);
    expect(plan.clearStorePurchaseFields).toBe(false);
  });

  it('maps lifetime product', () => {
    const plan = mapCustomerInfoToSyncPlan(
      {
        activeEntitlements: [
          {
            identifier: 'premium',
            productIdentifier: 'lifetime_unlock',
            latestPurchaseDateMs: 2_000,
            expirationDateMs: null,
            willRenew: false,
          },
        ],
        allPurchasedProductIds: ['lifetime_unlock'],
      },
      { hasLicenseKey: false }
    );
    expect(plan.purchaseType).toBe('lifetime');
  });

  it('clears store fields and premium when no entitlement and no license', () => {
    const plan = mapCustomerInfoToSyncPlan(
      { activeEntitlements: [], allPurchasedProductIds: [] },
      { hasLicenseKey: false }
    );
    expect(plan.setIsPremium).toBe(false);
    expect(plan.purchaseType).toBe(null);
    expect(plan.clearStorePurchaseFields).toBe(true);
  });

  it('clears store fields but keeps premium true when license present', () => {
    const plan = mapCustomerInfoToSyncPlan(
      { activeEntitlements: [], allPurchasedProductIds: [] },
      { hasLicenseKey: true }
    );
    expect(plan.setIsPremium).toBe(true);
    expect(plan.clearStorePurchaseFields).toBe(true);
    expect(plan.purchaseType).toBe(null);
  });
});
