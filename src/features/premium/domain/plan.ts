/**
 * The plan a person bought, in the words the app shows: which kind, when it started, when it
 * ends or renews. Pure, so the "no date we cannot back" rule is testable.
 */

import { BILLING_PRODUCT_IDS } from '../../../config/billing';
import type {
  ActiveEntitlementDTO,
  PlanKind,
  PlanRecord,
} from '../../../shared/types/purchases';
import { normalizeStoreProductId } from './mapProductId';

export const PLAN_KINDS: readonly PlanKind[] = [
  'weekly',
  'monthly',
  'yearly',
  'student',
  'lifetime',
];

export function isPlanKind(value: unknown): value is PlanKind {
  return typeof value === 'string' && (PLAN_KINDS as readonly string[]).includes(value);
}

/** Null for a product the app does not sell, so nothing is named wrongly. */
export function planKindFromProductId(productId: string): PlanKind | null {
  const id = normalizeStoreProductId(productId);
  if (id === BILLING_PRODUCT_IDS.weekly) return 'weekly';
  if (id === BILLING_PRODUCT_IDS.monthly) return 'monthly';
  if (id === BILLING_PRODUCT_IDS.yearly) return 'yearly';
  if (id === BILLING_PRODUCT_IDS.yearlyStudent) return 'student';
  if (id === BILLING_PRODUCT_IDS.lifetime) return 'lifetime';
  return null;
}

export function planFromEntitlement(entitlement: ActiveEntitlementDTO): PlanRecord | null {
  const kind = planKindFromProductId(entitlement.productIdentifier);
  if (!kind) return null;
  const lifetime = kind === 'lifetime';
  return {
    kind,
    productId: normalizeStoreProductId(entitlement.productIdentifier),
    store: entitlement.store ?? null,
    startedMs: entitlement.latestPurchaseDateMs,
    expiresMs: lifetime ? null : entitlement.expirationDateMs,
    willRenew: !lifetime && entitlement.willRenew,
    trial: entitlement.periodType === 'trial' || entitlement.periodType === 'intro',
    billingIssue: entitlement.billingIssueDetectedAtMs != null,
  };
}

/** What to say about the end of the plan. */
export type PlanTimeline =
  | { kind: 'forever' }
  | { kind: 'renews'; onMs: number }
  | { kind: 'ends'; onMs: number }
  | { kind: 'trialEnds'; onMs: number }
  | { kind: 'unknown' };

export function planTimeline(plan: PlanRecord): PlanTimeline {
  if (plan.kind === 'lifetime') return { kind: 'forever' };
  if (plan.expiresMs == null) return { kind: 'unknown' };
  if (plan.trial) return { kind: 'trialEnds', onMs: plan.expiresMs };
  return plan.willRenew
    ? { kind: 'renews', onMs: plan.expiresMs }
    : { kind: 'ends', onMs: plan.expiresMs };
}

/** Morning, afternoon or evening, from the hour on the person's clock. */
export function dayPart(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 5 || hour >= 18) return 'evening';
  return hour < 12 ? 'morning' : 'afternoon';
}
