import { BILLING_PRODUCT_IDS } from '../src/config/billing';
import { buildPaywallPlans } from '../src/features/premium/ui/paywallPlans';

type Prices = Parameters<typeof buildPaywallPlans>[1];

// A translator that shows the key and the params, so the test sees what would be interpolated.
const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}|${Object.values(params).join(',')}` : key;
const translate = t as Parameters<typeof buildPaywallPlans>[2];

const base: Prices = {
  yearly: '$14.99',
  monthly: '$2.99',
  weekly: '$0.99',
  lifetime: '$39.99',
  student: '$7.99',
  yearlyPerDay: '$0.05',
  monthlyAnchorYearly: '$35.88',
  yearlySavings: '58%',
};

describe('buildPaywallPlans', () => {
  it('derives the per-day, anchor and saving lines from the prices it is given', () => {
    const yearly = buildPaywallPlans(BILLING_PRODUCT_IDS, base, translate)[0];
    expect(yearly.price).toBe('$14.99');
    expect(yearly.subtitle).toBe('premium.plan.yearlySub|$0.05');
    expect(yearly.comparePrice).toBe('$35.88premium.period.year');
    expect(yearly.badge).toBe('premium.plan.save|58%');
  });

  it('leaves those lines out when the store gave nothing to compute them from', () => {
    const bare: Prices = {
      ...base,
      yearlyPerDay: null,
      monthlyAnchorYearly: null,
      yearlySavings: null,
    };
    const yearly = buildPaywallPlans(BILLING_PRODUCT_IDS, bare, translate)[0];
    expect(yearly.subtitle).toBeUndefined();
    expect(yearly.comparePrice).toBeUndefined();
    expect(yearly.badge).toBeUndefined();
  });

  it('never shows a rupee sign to a viewer whose store prices are in another currency', () => {
    const plans = buildPaywallPlans(BILLING_PRODUCT_IDS, base, translate);
    expect(JSON.stringify(plans)).not.toContain('₹');
  });

  it('lists yearly, monthly, weekly in that order', () => {
    const ids = buildPaywallPlans(BILLING_PRODUCT_IDS, base, translate).map(p => p.productId);
    expect(ids).toEqual([
      BILLING_PRODUCT_IDS.yearly,
      BILLING_PRODUCT_IDS.monthly,
      BILLING_PRODUCT_IDS.weekly,
    ]);
  });
});
