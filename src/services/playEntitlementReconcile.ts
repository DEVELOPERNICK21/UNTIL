import { getNumber, setNumber } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';

/** Re-check Play subscription entitlement at most every 12 hours. */
const RECONCILE_INTERVAL_MS = 12 * 60 * 60 * 1000;

export function shouldReconcilePlayEntitlement(now: number = Date.now()): boolean {
  const last = getNumber(STORAGE_KEYS.PLAY_ENTITLEMENT_RECONCILE_AT);
  if (!last) return true;
  return now - last >= RECONCILE_INTERVAL_MS;
}

export function recordPlayEntitlementReconcile(now: number = Date.now()): void {
  setNumber(STORAGE_KEYS.PLAY_ENTITLEMENT_RECONCILE_AT, now);
}
