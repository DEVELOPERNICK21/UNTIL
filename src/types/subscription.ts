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

/**
 * Purchase metadata for store-based premium (Play Billing on Android).
 * Keep this minimal; store raw tokens separately for future backend verification.
 */
export type PurchaseType = 'monthly' | 'yearly' | 'lifetime';

/**
 * AccessState — computed entitlement decision for feature gating.
 * SSOT inputs are stored in MMKV; this object is derived in a use case/hook.
 */
export interface AccessState {
  isPremium: boolean;
  purchaseType: PurchaseType | null;
  purchaseDate: number | null;

  trialStartDate: number | null;
  trialEndsAt: number | null;
  trialActive: boolean;

  appOpenCount: number;
  lifeScreenViewed: boolean;
  lifeEventUnlockUntil: number | null;
  lifeEventUnlockActive: boolean;
}
