/**
 * IAuthService - Port for provider-agnostic authentication.
 * Google first; Apple can be added behind this same port later.
 */

import type { AuthUser } from '../../types';

export interface IAuthService {
  signInWithGoogle(): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): AuthUser | null;
  subscribe(callback: (user: AuthUser | null) => void): () => void;
}
