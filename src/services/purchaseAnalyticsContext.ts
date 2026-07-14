/**
 * Threads paywall source/price into async Play Billing purchase listener (di.ts).
 */

import { getString, setString } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import type { AnalyticsPaywallSource } from './analytics';

export type PendingPurchaseContext = {
  plan_id: string;
  source: AnalyticsPaywallSource;
  price_display: string;
};

let purchaseSuccessListener: (() => void) | null = null;

export function setPendingPurchase(ctx: PendingPurchaseContext): void {
  setString(
    STORAGE_KEYS.PENDING_PURCHASE_CONTEXT,
    JSON.stringify(ctx)
  );
}

export function consumePendingPurchase(): PendingPurchaseContext | null {
  const raw = getString(STORAGE_KEYS.PENDING_PURCHASE_CONTEXT);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingPurchaseContext;
    if (!parsed?.plan_id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingPurchase(): void {
  setString(STORAGE_KEYS.PENDING_PURCHASE_CONTEXT, '');
}

export function setPurchaseSuccessListener(listener: (() => void) | null): void {
  purchaseSuccessListener = listener;
}

export function notifyPurchaseSuccess(): void {
  clearPendingPurchase();
  purchaseSuccessListener?.();
}
