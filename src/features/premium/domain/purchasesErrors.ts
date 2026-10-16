/**
 * Purchase error types shared by the RevenueCat adapter and purchase use cases.
 * Cancellation is a normal user action, so it must stay distinguishable from
 * a real failure that deserves an error message.
 *
 * Task 6: catch this (or use isPurchaseCancelledError) and return
 * `{ status: 'cancelled' }` instead of showing an error toast.
 */

export const PURCHASE_CANCELLED_CODE = 'purchase_cancelled';

export class PurchaseCancelledError extends Error {
  readonly code = PURCHASE_CANCELLED_CODE;
  readonly userCancelled = true as const;

  constructor(message = 'Purchase was cancelled.') {
    super(message);
    this.name = 'PurchaseCancelledError';
  }
}

/**
 * True when the user dismissed the store sheet.
 * Matches PurchaseCancelledError and raw RevenueCat errors that set
 * `userCancelled === true` (or code `1` / PURCHASE_CANCELLED_ERROR).
 */
export function isPurchaseCancelledError(error: unknown): boolean {
  if (error instanceof PurchaseCancelledError) return true;
  if (error == null || typeof error !== 'object') return false;
  const e = error as { userCancelled?: unknown; code?: unknown };
  if (e.userCancelled === true) return true;
  return String(e.code) === '1' || e.code === PURCHASE_CANCELLED_CODE;
}

/**
 * A short code for a failed purchase, for analytics: RevenueCat's readable code when it has one
 * ("PRODUCT_NOT_AVAILABLE_FOR_PURCHASE", "PURCHASE_NOT_ALLOWED", ...), else its numeric code, else
 * "unknown". Free of personal data.
 */
export function purchaseErrorCode(error: unknown): string {
  if (error == null || typeof error !== 'object') return 'unknown';
  const e = error as {
    code?: unknown;
    userInfo?: { readableErrorCode?: unknown } | null;
    underlyingErrorMessage?: unknown;
  };
  const readable = e.userInfo?.readableErrorCode;
  if (typeof readable === 'string' && readable) return readable.slice(0, 60);
  if (e.code != null && e.code !== '') return String(e.code).slice(0, 60);
  return 'unknown';
}

/** The store's own words for what went wrong, trimmed for analytics. */
export function purchaseErrorDetail(error: unknown): string {
  if (error == null || typeof error !== 'object') return '';
  const under = (error as { underlyingErrorMessage?: unknown }).underlyingErrorMessage;
  return typeof under === 'string' ? under.slice(0, 100) : '';
}
