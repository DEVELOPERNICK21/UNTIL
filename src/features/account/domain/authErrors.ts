/**
 * Auth error types shared by the auth adapter and the hooks that surface it.
 * Cancellation is a normal user action, so it must stay distinguishable from
 * a real failure that deserves an error message.
 */

import { t } from '../../../shared/i18n/translate';

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

export const AUTH_REQUIRES_RECENT_LOGIN_CODE = 'auth/requires-recent-login';
export const AUTH_REQUIRES_PASSWORD_REAUTH_CODE = 'auth/requires-password-reauth';

export class AuthRequiresRecentLoginError extends Error {
  readonly code = AUTH_REQUIRES_RECENT_LOGIN_CODE;

  constructor(message = t('account.error.signInAgain')) {
    super(message);
    this.name = 'AuthRequiresRecentLoginError';
  }
}

export class AuthRequiresPasswordError extends Error {
  readonly code = AUTH_REQUIRES_PASSWORD_REAUTH_CODE;

  constructor(message = t('account.error.enterPasswordToDelete')) {
    super(message);
    this.name = 'AuthRequiresPasswordError';
  }
}

export function isAuthRequiresRecentLoginError(error: unknown): boolean {
  if (error instanceof AuthRequiresRecentLoginError) return true;
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return code === AUTH_REQUIRES_RECENT_LOGIN_CODE;
}

export function isAuthRequiresPasswordError(error: unknown): boolean {
  if (error instanceof AuthRequiresPasswordError) return true;
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return code === AUTH_REQUIRES_PASSWORD_REAUTH_CODE;
}

/** What went wrong, short enough and free enough of personal data to send to analytics. */
export function describeAuthFailure(error: unknown): { error_code: string; error_message: string } {
  const code = (error as { code?: unknown } | null | undefined)?.code;
  const message = error instanceof Error ? error.message : String(error ?? '');
  return {
    error_code: code == null || code === '' ? 'unknown' : String(code).slice(0, 60),
    error_message: message.replace(/[^\s@]+@[^\s@]+/g, '[email]').slice(0, 100),
  };
}

/**
 * Google Sign-In reports setup problems as bare native codes ("10", "DEVELOPER_ERROR"). Say what
 * the person can do about it instead. Null when the error is not one of these.
 */
export function friendlyGoogleSignInMessage(error: unknown): string | null {
  const { error_code: code, error_message: message } = describeAuthFailure(error);
  const text = `${code} ${message}`.toUpperCase();
  if (code === '10' || text.includes('DEVELOPER_ERROR')) {
    return t('account.error.google.unavailable');
  }
  if (code === '7' || text.includes('NETWORK_ERROR')) {
    return t('account.error.google.network');
  }
  if (text.includes('PLAY_SERVICES_NOT_AVAILABLE')) {
    return t('account.error.google.playServices');
  }
  if (code === '12500' || code === '8' || text.includes('SIGN_IN_FAILED')) {
    return t('account.error.google.notFinished');
  }
  return null;
}

function authErrorCode(error: unknown): string {
  return error && typeof error === 'object' && 'code' in error
    ? String((error as { code: unknown }).code)
    : '';
}

/** Firebase's error code → a message the person can act on. Unknown errors keep their own text. */
export function mapAuthError(error: unknown, fallback: string): Error {
  switch (authErrorCode(error)) {
    case 'auth/invalid-email':
      return new Error(t('account.error.validEmail'));
    case 'auth/user-disabled':
      return new Error(t('account.error.disabled'));
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return new Error(t('account.error.wrongCredentials'));
    case 'auth/email-already-in-use':
      return new Error(t('account.error.emailInUse'));
    case 'auth/weak-password':
      return new Error(t('account.error.passwordMin'));
    case 'auth/too-many-requests':
      return new Error(t('account.error.tooMany'));
    case 'auth/network-request-failed':
      return new Error(t('account.error.network'));
    default:
      if (error instanceof Error && error.message) {
        return new Error(error.message);
      }
      return new Error(fallback);
  }
}

export function mapAppleAuthError(error: unknown, fallback: string): Error {
  switch (authErrorCode(error)) {
    case 'auth/invalid-credential':
      return new Error(t('account.error.appleFailed'));
    case 'auth/operation-not-allowed':
      return new Error(t('account.error.appleNotSetUp'));
    default:
      return mapAuthError(error, fallback);
  }
}
