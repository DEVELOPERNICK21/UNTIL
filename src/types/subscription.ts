/**
 * Subscription types — license activation, verification, device binding
 */

export type ActivationResult =
  | { success: true }
  | {
      success: false;
      code: 'invalid_license' | 'already_activated' | 'network_error' | 'unknown';
      message: string;
    };

export type VerificationResult =
  | { valid: true }
  | {
      valid: false;
      code: 'invalid' | 'revoked' | 'device_mismatch' | 'network_error' | 'unknown';
      message: string;
    };

export interface SubscriptionState {
  isPremium: boolean;
  deviceId: string | null;
  lastVerifiedAt: number | null;
}
