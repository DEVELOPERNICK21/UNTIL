/**
 * Map Play / RevenueCat product IDs to domain purchase type.
 * Play subscriptions in RC use `productId:basePlanId` (e.g. yearly_subscription:yearly-default).
 */

import type { PurchaseType } from '../../types';
import { BILLING_PRODUCT_IDS } from '../../config/billing';

/** Strip Google Play base-plan suffix so `yearly_subscription:yearly-default` → `yearly_subscription`. */
export function normalizeStoreProductId(productId: string): string {
  const trimmed = productId.trim();
  const colon = trimmed.indexOf(':');
  return colon >= 0 ? trimmed.slice(0, colon) : trimmed;
}

export function productIdToPurchaseType(productId: string): PurchaseType | null {
  const id = normalizeStoreProductId(productId);
  if (id === BILLING_PRODUCT_IDS.monthly) return 'monthly';
  if (
    id === BILLING_PRODUCT_IDS.yearly ||
    id === BILLING_PRODUCT_IDS.yearlyStudent
  ) {
    return 'yearly';
  }
  if (id === BILLING_PRODUCT_IDS.lifetime) return 'lifetime';
  return null;
}

export function isKnownBillingProductId(productId: string): boolean {
  return productIdToPurchaseType(productId) != null;
}

/** True if RC package product matches a paywall product id (exact or productId:basePlan). */
export function storeProductMatchesPaywallId(
  storeProductId: string,
  paywallProductId: string
): boolean {
  const store = storeProductId.trim();
  const want = paywallProductId.trim();
  if (store === want) return true;
  return normalizeStoreProductId(store) === want;
}

/** @deprecated alias — prefer storeProductMatchesPaywallId */
export const storeProductIdsMatch = storeProductMatchesPaywallId;
