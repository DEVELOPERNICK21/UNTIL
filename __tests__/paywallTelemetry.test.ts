import {
  logPaywallDismissed,
  logPaywallShown,
  logPlanSelected,
  logPurchaseFailed,
  logRestoreEmpty,
  logRestoreFailed,
  purchaseRevenueParams,
} from '../src/features/premium/services/paywallTelemetry';
import { BILLING_PRODUCT_IDS } from '../src/config/billing';

const mockLog = jest.fn();
jest.mock('../src/shared/analytics/analytics', () => ({
  logAnalyticsEvent: (...args: unknown[]) => mockLog(...args),
}));

describe('paywall telemetry', () => {
  beforeEach(() => mockLog.mockClear());

  it('paywall_shown and paywall_dismissed carry surface, kind and time open', () => {
    jest.spyOn(Date, 'now').mockReturnValue(10_000 + 12_400);
    logPaywallShown('onboarding_paywall', 'revenuecat');
    logPaywallDismissed('onboarding_paywall', 'revenuecat', 10_000, 'close');
    expect(mockLog).toHaveBeenNthCalledWith(1, 'paywall_shown', {
      surface: 'onboarding_paywall',
      kind: 'revenuecat',
      is_premium: false,
    });
    expect(mockLog).toHaveBeenNthCalledWith(2, 'paywall_dismissed', {
      surface: 'onboarding_paywall',
      kind: 'revenuecat',
      method: 'close',
      seconds_open: 12,
    });
    jest.restoreAllMocks();
  });

  it('plan selection and restore outcomes are logged with their source', () => {
    logPlanSelected('premium_screen', BILLING_PRODUCT_IDS.monthly);
    logRestoreEmpty('premium_screen');
    logRestoreFailed('premium_screen', { code: '7' });
    logRestoreFailed('premium_screen', new Error('no code'));
    expect(mockLog.mock.calls).toEqual([
      ['paywall_plan_selected', { surface: 'premium_screen', plan_id: 'monthly_subscription' }],
      ['premium_restore_empty', { source: 'premium_screen' }],
      ['premium_restore_failed', { source: 'premium_screen', error_code: '7' }],
      ['premium_restore_failed', { source: 'premium_screen', error_code: 'unknown' }],
    ]);
  });

  it('a failed purchase keeps its code and a message cut to 100 characters', () => {
    logPurchaseFailed({
      planId: 'yearly_subscription',
      source: 'onboarding_paywall',
      priceDisplay: '$14.99',
      code: 'PRODUCT_NOT_AVAILABLE',
      message: 'x'.repeat(300),
    });
    const [, params] = mockLog.mock.calls[0];
    expect(params.error_code).toBe('PRODUCT_NOT_AVAILABLE');
    expect(params.error_message).toHaveLength(100);
  });

  it('purchase revenue is the store price as a number, its currency and the billing period', () => {
    const products = [
      { productId: BILLING_PRODUCT_IDS.yearly, amount: 14.99, currency: 'USD' },
      { productId: BILLING_PRODUCT_IDS.lifetime, amount: 39.99, currency: 'USD' },
    ];
    expect(purchaseRevenueParams(products, BILLING_PRODUCT_IDS.yearly)).toEqual({
      value: 14.99,
      currency: 'USD',
      period: 'year',
    });
    expect(purchaseRevenueParams(products, BILLING_PRODUCT_IDS.lifetime).period).toBe('lifetime');
    // no price known for the product → no invented value
    expect(purchaseRevenueParams(products, BILLING_PRODUCT_IDS.weekly)).toEqual({
      value: undefined,
      currency: undefined,
      period: 'week',
    });
  });
});
