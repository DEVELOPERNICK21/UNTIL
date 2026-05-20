/**
 * Google Play product IDs — must match Play Console exactly.
 */
import { MONETIZATION_FEATURE_FLAGS } from './monetization';

export const BILLING_PRODUCT_IDS = {
  monthly: 'monthly_subscription',
  yearly: 'yearly_subscription',
  yearlyStudent: 'yearly_subscription_student',
  lifetime: 'lifetime_unlock',
} as const;

export const BILLING_SUBSCRIPTION_IDS: string[] = [
  BILLING_PRODUCT_IDS.monthly,
  BILLING_PRODUCT_IDS.yearly,
  ...(MONETIZATION_FEATURE_FLAGS.studentPlanEnabled
    ? [BILLING_PRODUCT_IDS.yearlyStudent]
    : []),
];

export const BILLING_INAPP_IDS: string[] = [BILLING_PRODUCT_IDS.lifetime];

/** SKUs on Premium / onboarding paywall. */
export const BILLING_PAYWALL_IDS: string[] = [
  BILLING_PRODUCT_IDS.yearly,
  BILLING_PRODUCT_IDS.monthly,
  BILLING_PRODUCT_IDS.lifetime,
  ...(MONETIZATION_FEATURE_FLAGS.studentPlanEnabled
    ? [BILLING_PRODUCT_IDS.yearlyStudent]
    : []),
];

export function isSubscriptionProductId(productId: string): boolean {
  return BILLING_SUBSCRIPTION_IDS.includes(productId);
}

export function isLifetimeProductId(productId: string): boolean {
  return productId === BILLING_PRODUCT_IDS.lifetime;
}
