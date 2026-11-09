/**
 * IPlanRecordStore - Port for what the store told us about the person's plan.
 * Kept apart from ISubscriptionRepository: that one answers "is Premium on", this one answers
 * "which plan, until when" and remembers the welcome that is still to be shown.
 */

import type { PlanKind, PlanRecord } from '../../../../shared/types/purchases';

/** A fresh activation that has not been greeted yet. */
export interface PendingWelcome {
  kind: PlanKind;
  at: number;
}

export interface IPlanRecordStore {
  getPlan(): PlanRecord | null;
  setPlan(plan: PlanRecord | null): void;

  /** Every plan kind ever active on this account. Never shrinks, so badges stay earned. */
  getPlansBought(): PlanKind[];
  addPlanBought(kind: PlanKind): void;

  getPendingWelcome(): PendingWelcome | null;
  setPendingWelcome(welcome: PendingWelcome | null): void;

  subscribe(callback: () => void): () => void;
}
