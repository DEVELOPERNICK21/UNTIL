/**
 * Deferred onboarding paywall — shown on 2nd+ app session, not before first Home visit.
 */

import { getString, setString } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import { getAccessStateUseCase } from '../di';

const MIN_APP_OPENS = 2;

export function shouldShowDeferredPaywall(): boolean {
  if (getString(STORAGE_KEYS.DEFERRED_PAYWALL_SHOWN) === '1') return false;
  const access = getAccessStateUseCase.execute();
  if (access.isPremium) return false;
  return access.appOpenCount >= MIN_APP_OPENS;
}

export function markDeferredPaywallShown(): void {
  setString(STORAGE_KEYS.DEFERRED_PAYWALL_SHOWN, '1');
}
