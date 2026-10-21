/**
 * IAuthService - Port for provider-agnostic authentication.
 * Apple (iOS only), Google, and email/password.
 */

import type { AuthUser } from '../../../../shared/types';

export type AppleReauthOptions = {
  /** Revoke the Apple token after reauth (required before account deletion, App Store 5.1.1(v)). */
  revokeToken?: boolean;
};

export interface IAuthService {
  /** True only on iOS 13+ where Sign in with Apple is available natively. */
  isAppleSignInAvailable(): boolean;
  signInWithApple(): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  createAccountWithEmail(email: string, password: string): Promise<AuthUser>;
  /** Emails a link to choose a new password. Succeeds whether or not the address has an account. */
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  reauthenticateWithApple(options?: AppleReauthOptions): Promise<void>;
  reauthenticateWithGoogle(): Promise<void>;
  reauthenticateWithEmail(password: string): Promise<void>;
  getCurrentUser(): AuthUser | null;
  subscribe(callback: (user: AuthUser | null) => void): () => void;
}
