/**
 * IAuthService - Port for provider-agnostic authentication.
 * Google + email/password now; Apple can be added behind this same port later.
 */

import type { AuthUser } from '../../types';

export interface IAuthService {
  signInWithGoogle(): Promise<AuthUser>;
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  createAccountWithEmail(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): AuthUser | null;
  subscribe(callback: (user: AuthUser | null) => void): () => void;
}
