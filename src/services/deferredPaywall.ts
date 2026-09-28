/**
 * Deferred onboarding paywall — shown on 2nd+ app session, not before first Home visit.
 */

import { getString, setString } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import type { AccessState } from '../types';

const MIN_APP_OPENS = 2;

export function shouldShowDeferredPaywall(access: AccessState): boolean {
  if (getString(STORAGE_KEYS.DEFERRED_PAYWALL_SHOWN) === '1') return false;
  if (access.isPremium) return false;
  return access.appOpenCount >= MIN_APP_OPENS;
}

export function markDeferredPaywallShown(): void {
  setString(STORAGE_KEYS.DEFERRED_PAYWALL_SHOWN, '1');
}
