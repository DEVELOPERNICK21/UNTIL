/**
 * Auth error types shared by the auth adapter and the hooks that surface it.
 * Cancellation is a normal user action, so it must stay distinguishable from
 * a real failure that deserves an error message.
 */

export const AUTH_CANCELLED_CODE = 'auth/cancelled';

export class AuthCancelledError extends Error {
  readonly code = AUTH_CANCELLED_CODE;

  constructor(message = 'Sign-in was cancelled.') {
    super(message);
    this.name = 'AuthCancelledError';
  }
}

/**
 * Google Sign-In reports cancellation through native codes rather than a
 * typed error: -5 (iOS), 12501 (Android), SIGN_IN_CANCELLED / ERR_CANCELED.
 */
const NATIVE_CANCEL_CODES = new Set([
  AUTH_CANCELLED_CODE,
  '-5',
  '12501',
  'SIGN_IN_CANCELLED',
  'ERR_CANCELED',
]);

export function isAuthCancelledError(error: unknown): boolean {
  if (error instanceof AuthCancelledError) return true;
  const code = (error as { code?: unknown } | null | undefined)?.code;
  if (typeof code === 'string' || typeof code === 'number') {
    return NATIVE_CANCEL_CODES.has(String(code));
  }
  return false;
}
