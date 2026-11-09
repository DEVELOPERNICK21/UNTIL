import { mapOfferingPackagesToRows } from '../src/features/premium/domain/mapOfferingPackages';

describe('mapOfferingPackagesToRows', () => {
  it('maps offering packages to billing rows keyed by productId', () => {
    const rows = mapOfferingPackagesToRows({
      identifier: 'default',
      packages: [
        {
          identifier: '$rc_annual',
          productId: 'yearly_subscription',
          title: 'Yearly',
          description: 'Best value',
          priceString: '₹500.00',
          price: 500,
          currencyCode: 'INR',
        },
        {
          identifier: '$rc_monthly',
          productId: 'monthly_subscription',
          title: 'Monthly',
          description: '',
          priceString: '₹100.00',
          price: 100,
          currencyCode: 'INR',
        },
      ],
    });

    expect(rows).toEqual([
      {
        productId: 'yearly_subscription',
        title: 'Yearly',
        description: 'Best value',
        price: '₹500.00',
        amount: 500,
        currency: 'INR',
      },
      {
        productId: 'monthly_subscription',
        title: 'Monthly',
        price: '₹100.00',
        amount: 100,
        currency: 'INR',
      },
    ]);
    expect(rows.find(r => r.productId === 'yearly_subscription')?.price).toBe(
      '₹500.00'
    );
  });

  it('returns an empty list when offerings are missing', () => {
    expect(mapOfferingPackagesToRows(null)).toEqual([]);
    expect(mapOfferingPackagesToRows(undefined)).toEqual([]);
    expect(mapOfferingPackagesToRows({ identifier: 'default', packages: [] })).toEqual(
      []
    );
  });
});
