/**
 * ObservePlanUseCase - the plan to show, and the welcome that is waiting to be shown.
 */

import type { PlanRecord } from '../../../../shared/types/purchases';
import type { IPlanRecordStore, PendingWelcome } from '../ports/IPlanRecordStore';

export interface PlanView {
  plan: PlanRecord | null;
  welcome: PendingWelcome | null;
}

export class ObservePlanUseCase {
  constructor(private readonly store: IPlanRecordStore) {}

  observe(): PlanView {
    return { plan: this.store.getPlan(), welcome: this.store.getPendingWelcome() };
  }

  subscribe(callback: () => void): () => void {
    return this.store.subscribe(callback);
  }

  /** The greeting has been shown (or skipped): do not show it again. */
  dismissWelcome(): void {
    this.store.setPendingWelcome(null);
  }
}
