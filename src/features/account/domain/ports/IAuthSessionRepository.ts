/**
 * IAuthSessionRepository - Port for the local auth session mirror.
 * SSOT for the signed-in uid/email and whether this device is allowed cloud premium.
 * Firebase is the source of truth for identity; this is the local cache the rest
 * of the app (incl. access gating) reads synchronously.
 */

type Subscriber = () => void;

export interface AuthSessionState {
  uid: string | null;
  email: string | null;
  devicePremiumAllowed: boolean;
}

export interface IAuthSessionRepository {
  getUid(): string | null;
  setUid(uid: string | null): void;
  getEmail(): string | null;
  setEmail(email: string | null): void;
  /** Default true when signed out. */
  getDevicePremiumAllowed(): boolean;
  setDevicePremiumAllowed(value: boolean): void;
  clear(): void;
  getState(): AuthSessionState;
  subscribe(callback: Subscriber): () => void;
}
