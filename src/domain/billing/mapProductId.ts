/**
 * Map Play product IDs to domain purchase type.
 */

import type { PurchaseType } from '../../types';
import { BILLING_PRODUCT_IDS } from '../../config/billing';

export function productIdToPurchaseType(productId: string): PurchaseType | null {
  if (productId === BILLING_PRODUCT_IDS.monthly) return 'monthly';
  if (productId === BILLING_PRODUCT_IDS.yearly) return 'yearly';
  if (productId === BILLING_PRODUCT_IDS.lifetime) return 'lifetime';
  return null;
}

export function isKnownBillingProductId(productId: string): boolean {
  return productIdToPurchaseType(productId) != null;
}
