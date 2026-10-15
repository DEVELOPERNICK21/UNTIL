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
