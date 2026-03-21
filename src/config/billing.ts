/**
 * Google Play product IDs — override via env or build-time replacement if needed.
 * Must match Play Console.
 */
export const BILLING_PRODUCT_IDS = {
  monthly: 'monthly_subscription',
  yearly: 'yearly_subscription',
  lifetime: 'lifetime_unlock',
} as const;

export const BILLING_SUBSCRIPTION_IDS: string[] = [
  BILLING_PRODUCT_IDS.monthly,
  BILLING_PRODUCT_IDS.yearly,
];

export const BILLING_INAPP_IDS: string[] = [BILLING_PRODUCT_IDS.lifetime];

export function isSubscriptionProductId(productId: string): boolean {
  return BILLING_SUBSCRIPTION_IDS.includes(productId);
}

export function isLifetimeProductId(productId: string): boolean {
  return productId === BILLING_PRODUCT_IDS.lifetime;
}
