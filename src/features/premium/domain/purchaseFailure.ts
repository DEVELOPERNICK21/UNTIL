/**
 * What a failed purchase means for the person who tapped "subscribe".
 *
 * Most failures are a real problem (a store or configuration error) and keep the generic alert.
 * Three are not, and each has a better answer than "Purchase failed":
 *   alreadyOwned  the store account already holds this product, so the fix is a restore;
 *   pending       the payment is still being processed (cash, a slow bank), nothing went wrong;
 *   offline       no connection, so try again.
 *
 * `code` is what `purchaseErrorCode` produces: RevenueCat's readable name ("PAYMENT_PENDING") or its
 * numeric code ("20"). Both spellings are accepted, with or without the "_ERROR" suffix.
 */

export type PurchaseFailureKind = 'alreadyOwned' | 'pending' | 'offline' | 'other';

const ALREADY_OWNED = new Set(['PRODUCT_ALREADY_PURCHASED', '6']);
const PENDING = new Set(['PAYMENT_PENDING', '20']);
const OFFLINE = new Set(['NETWORK', 'OFFLINE_CONNECTION', '10', '35']);

export function classifyPurchaseFailure(code: unknown): PurchaseFailureKind {
  if (code == null) return 'other';
  const key = String(code)
    .trim()
    .toUpperCase()
    .replace(/_ERROR$/, '');
  if (ALREADY_OWNED.has(key)) return 'alreadyOwned';
  if (PENDING.has(key)) return 'pending';
  if (OFFLINE.has(key)) return 'offline';
  return 'other';
}
