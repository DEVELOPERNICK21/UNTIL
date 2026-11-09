/**
 * Paywall funnel telemetry: what was shown, what was chosen, how it ended.
 * Event names live in shared/analytics/paywallEvents.ts.
 */

import {
  logAnalyticsEvent,
  type AnalyticsPaywallSource,
} from '../../../shared/analytics/analytics';
import { BILLING_PRODUCT_IDS } from '../../../config/billing';

/** 'custom' is our own PremiumPaywallBody; 'revenuecat' is the dashboard-designed paywall. */
export type PaywallKind = 'custom' | 'revenuecat';

type PricedRow = { productId: string; amount?: number; currency?: string };

const seconds = (sinceMs: number) => Math.round((Date.now() - sinceMs) / 1000);

export function logPaywallShown(
  surface: AnalyticsPaywallSource,
  kind: PaywallKind,
  isPremium = false,
): void {
  void logAnalyticsEvent('paywall_shown', { surface, kind, is_premium: isPremium });
}

export function logPaywallDismissed(
  surface: AnalyticsPaywallSource,
  kind: PaywallKind,
  shownAtMs: number,
  method: string,
): void {
  void logAnalyticsEvent('paywall_dismissed', {
    surface,
    kind,
    method,
    seconds_open: seconds(shownAtMs),
  });
}

export function logPlanSelected(
  surface: AnalyticsPaywallSource,
  planId: string,
): void {
  void logAnalyticsEvent('paywall_plan_selected', { surface, plan_id: planId });
}

export function logRestoreEmpty(source: AnalyticsPaywallSource): void {
  void logAnalyticsEvent('premium_restore_empty', { source });
}

export function logRestoreFailed(
  source: AnalyticsPaywallSource,
  error: unknown,
): void {
  const code = (error as { code?: unknown } | null)?.code;
  void logAnalyticsEvent('premium_restore_failed', {
    source,
    error_code: typeof code === 'string' || typeof code === 'number' ? code : 'unknown',
  });
}

export function logPurchaseFailed(args: {
  planId: string;
  source: AnalyticsPaywallSource;
  priceDisplay: string;
  code?: unknown;
  message?: string;
}): void {
  const { code } = args;
  void logAnalyticsEvent('premium_purchase_failed', {
    plan_id: args.planId,
    source: args.source,
    price_display: args.priceDisplay,
    error_code: typeof code === 'string' || typeof code === 'number' ? code : 'unknown',
    error_message: (args.message ?? 'Unknown error').slice(0, 100),
    payment_provider: 'revenuecat',
  });
}

/** Billing period of a product id, for revenue breakdowns. */
function periodOf(productId: string): string {
  switch (productId) {
    case BILLING_PRODUCT_IDS.yearly:
    case BILLING_PRODUCT_IDS.yearlyStudent:
      return 'year';
    case BILLING_PRODUCT_IDS.monthly:
      return 'month';
    case BILLING_PRODUCT_IDS.weekly:
      return 'week';
    case BILLING_PRODUCT_IDS.lifetime:
      return 'lifetime';
    default:
      return 'unknown';
  }
}

/**
 * Numeric revenue fields for premium_purchase_completed: `value` in `currency` (the store's
 * price for the product, before store fees and tax), plus the billing `period`. Without these
 * the event only carried a display string and revenue could not be summed.
 */
export function purchaseRevenueParams(
  products: PricedRow[],
  productId: string,
): { value?: number; currency?: string; period: string } {
  const row = products.find(p => p.productId === productId);
  return { value: row?.amount, currency: row?.currency, period: periodOf(productId) };
}
