import {
  normalizeStoreProductId,
  productIdToPurchaseType,
  storeProductIdsMatch,
} from '../src/domain/billing/mapProductId';

describe('mapProductId Play base plans', () => {
  it('strips productId:basePlanId', () => {
    expect(normalizeStoreProductId('yearly_subscription:yearly-default')).toBe(
      'yearly_subscription'
    );
    expect(normalizeStoreProductId('lifetime_unlock')).toBe('lifetime_unlock');
  });

  it('maps Play subscription identifiers with base plans', () => {
    expect(
      productIdToPurchaseType('yearly_subscription:yearly-default')
    ).toBe('yearly');
    expect(
      productIdToPurchaseType('monthly_subscription:monthly-default')
    ).toBe('monthly');
    expect(
      productIdToPurchaseType('yearly_subscription_student:yearly-student-default')
    ).toBe('yearly');
    expect(productIdToPurchaseType('lifetime_unlock')).toBe('lifetime');
  });

  it('matches paywall product ids to store identifiers', () => {
    expect(
      storeProductIdsMatch(
        'yearly_subscription:yearly-default',
        'yearly_subscription'
      )
    ).toBe(true);
    expect(storeProductIdsMatch('lifetime_unlock', 'lifetime_unlock')).toBe(
      true
    );
    expect(
      storeProductIdsMatch('monthly_subscription:monthly-default', 'yearly_subscription')
    ).toBe(false);
  });
});
