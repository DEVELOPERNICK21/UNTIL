/**
 * Pure access / entitlement rules (freemium + trial + event unlock).
 * Inputs come from MMKV via ISubscriptionRepository; UI uses computed AccessState.
 */

import type { AccessState, PurchaseType } from '../types';
import { LIFE_EVENT_UNLOCK_MS, TRIAL_DURATION_MS } from '../config/accessConstants';

export { TRIAL_DURATION_MS, LIFE_EVENT_UNLOCK_MS };

export interface AccessControlInput {
  now: number;
  isPremium: boolean;
  purchaseType: PurchaseType | null;
  purchaseDate: number | null;
  trialStartDate: number | null;
  appOpenCount: number;
  lifeScreenViewed: boolean;
  lifeUnlockUntil: number | null;
}

export function computeAccessState(input: AccessControlInput): AccessState {
  const trialEndsAt =
    input.trialStartDate != null
      ? input.trialStartDate + TRIAL_DURATION_MS
      : null;
  const trialActive =
    trialEndsAt != null && input.now <= trialEndsAt;

  const lifeEventUnlockActive =
    input.lifeUnlockUntil != null && input.now < input.lifeUnlockUntil;

  return {
    isPremium: input.isPremium,
    purchaseType: input.purchaseType,
    purchaseDate: input.purchaseDate,
    trialStartDate: input.trialStartDate,
    trialEndsAt,
    trialActive,
    appOpenCount: input.appOpenCount,
    lifeScreenViewed: input.lifeScreenViewed,
    lifeEventUnlockUntil: input.lifeUnlockUntil,
    lifeEventUnlockActive,
  };
}

/** Month widget, overlay, Dynamic Island, etc. */
export function hasPremiumBundle(access: AccessState): boolean {
  return access.isPremium || access.trialActive;
}

export function canAccessLife(access: AccessState): boolean {
  return access.isPremium || access.trialActive || access.lifeEventUnlockActive;
}
