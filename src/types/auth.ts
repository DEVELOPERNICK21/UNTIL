/**
 * Account / auth DTOs — provider-agnostic (Google first, Apple later).
 */

export type AuthProviderId = 'google' | 'apple';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  providers: AuthProviderId[];
}

export interface AccountDevice {
  id: string;
  platform: 'ios' | 'android';
  label: string | null;
  lastSeenAt: number;
  createdAt: number;
  active: boolean;
}

export interface CloudEntitlement {
  active: boolean;
  source: 'play' | 'app_store' | 'license' | 'none';
  purchaseType: 'monthly' | 'yearly' | 'lifetime' | null;
  lastValidatedAt: number;
}

export interface CloudUserProfile {
  birthDate: string | null;
  deathAge: number | null;
  theme: string | null;
  updatedAt: number;
}

/**
 * Why a device slot was not claimed. `limit_reached` is a real answer from the
 * account; the other two mean the cloud call failed and nothing is known.
 */
export type RegisterDeviceFailureReason =
  | 'limit_reached'
  | 'read_failed'
  | 'write_failed';

/** Result of trying to claim one of the account's device slots for this phone. */
export interface RegisterDeviceResult {
  registered: boolean;
  deviceId: string;
  reason?: RegisterDeviceFailureReason;
}

export interface SignInResult {
  user: AuthUser;
  deviceRegistered: boolean;
  deviceLimitReached: boolean;
}

/** What the profile merge did, for analytics and screen messaging. */
export interface ProfileSyncResult {
  appliedFromCloud: boolean;
  pushedToCloud: boolean;
}
