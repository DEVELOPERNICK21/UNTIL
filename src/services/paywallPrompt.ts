import { getNumber, setNumber } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import { PAYWALL_DISMISS_COOLDOWN_MS } from '../config/monetization';
import type { AccessState } from '../types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function shouldShowPaywallAfterCooldown(now: number = Date.now()): boolean {
  const last = getNumber(STORAGE_KEYS.PAYWALL_DISMISSED_AT);
  if (!last) return true;
  return now - last >= PAYWALL_DISMISS_COOLDOWN_MS;
}

export function recordPaywallDismissed(now: number = Date.now()): void {
  setNumber(STORAGE_KEYS.PAYWALL_DISMISSED_AT, now);
}

/**
 * High-intent moment: 24h Life preview ended, user is not on trial/premium.
 */
export function shouldPromptLifeUnlockEnded(
  access: AccessState,
  now: number = Date.now()
): boolean {
  if (access.isPremium || access.trialActive || access.lifeEventUnlockActive) {
    return false;
  }
  const until = access.lifeEventUnlockUntil;
  if (until == null || until <= 0) return false;
  if (now < until) return false;
  if (now - until > SEVEN_DAYS_MS) return false;
  return shouldShowPaywallAfterCooldown(now);
}
