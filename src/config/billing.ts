/**
 * Store product IDs — must match App Store Connect / Play Console / RevenueCat.
 */
import { MONETIZATION_FEATURE_FLAGS } from './monetization';

export const BILLING_PRODUCT_IDS = {
  weekly: 'weekly_subscription',
  monthly: 'monthly_subscription',
  yearly: 'yearly_subscription',
  yearlyStudent: 'yearly_subscription_student',
  lifetime: 'lifetime_unlock',
} as const;

export const BILLING_SUBSCRIPTION_IDS: string[] = [
  BILLING_PRODUCT_IDS.weekly,
  BILLING_PRODUCT_IDS.monthly,
  BILLING_PRODUCT_IDS.yearly,
  ...(MONETIZATION_FEATURE_FLAGS.studentPlanEnabled
    ? [BILLING_PRODUCT_IDS.yearlyStudent]
    : []),
];

export const BILLING_INAPP_IDS: string[] = [BILLING_PRODUCT_IDS.lifetime];

/**
 * Main paywall cards only — keep to 3 so choice stays clear.
 * Lifetime is a secondary CTA; student stays behind email verify.
 */
export const BILLING_PAYWALL_IDS: string[] = [
  BILLING_PRODUCT_IDS.yearly,
  BILLING_PRODUCT_IDS.monthly,
  BILLING_PRODUCT_IDS.weekly,
];

export function isSubscriptionProductId(productId: string): boolean {
  return BILLING_SUBSCRIPTION_IDS.includes(productId);
}

export function isLifetimeProductId(productId: string): boolean {
  return productId === BILLING_PRODUCT_IDS.lifetime;
}
