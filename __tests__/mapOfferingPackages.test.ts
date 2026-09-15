import { mapOfferingPackagesToRows } from '../src/domain/billing/mapOfferingPackages';

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
        },
        {
          identifier: '$rc_monthly',
          productId: 'monthly_subscription',
          title: 'Monthly',
          description: '',
          priceString: '₹100.00',
        },
      ],
    });

    expect(rows).toEqual([
      {
        productId: 'yearly_subscription',
        title: 'Yearly',
        description: 'Best value',
        price: '₹500.00',
      },
      {
        productId: 'monthly_subscription',
        title: 'Monthly',
        price: '₹100.00',
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
