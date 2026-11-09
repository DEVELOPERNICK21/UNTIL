import { mapCustomerInfoToSyncPlan } from '../mapCustomerInfo';
import type { ISubscriptionRepository } from '../ports/ISubscriptionRepository';
import type { IPlanRecordStore } from '../ports/IPlanRecordStore';
import type { CustomerInfoDTO, PlanRecord } from '../../../../shared/types/purchases';

export class SyncCustomerInfoUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly onApplied?: () => void,
    private readonly planStore?: IPlanRecordStore,
    private readonly now: () => number = Date.now,
  ) {}

  execute(info: CustomerInfoDTO): void {
    const hadStorePlan = this.subscriptionRepository.getPurchaseType() != null;
    const plan = mapCustomerInfoToSyncPlan(info, {
      hasLicenseKey: Boolean(this.subscriptionRepository.getLicenseKey()?.trim()),
      hasStorePurchase: hadStorePlan,
    });
    this.subscriptionRepository.setIsPremium(plan.setIsPremium);
    if (plan.clearStorePurchaseFields) {
      this.subscriptionRepository.setPurchaseType(null);
      this.subscriptionRepository.setPurchaseDate(null);
      this.subscriptionRepository.setPurchaseToken(null);
    } else {
      if (plan.purchaseType != null) {
        this.subscriptionRepository.setPurchaseType(plan.purchaseType);
      }
      if (plan.purchaseDateMs != null) {
        this.subscriptionRepository.setPurchaseDate(plan.purchaseDateMs);
      }
    }
    this.recordPlan(plan.plan, hadStorePlan);
    this.onApplied?.();
  }

  /**
   * Keeps the plan the store reports. A plan nobody had seen before queues a welcome; a renewal,
   * or a subscriber from before this existed, only refreshes the record.
   */
  private recordPlan(next: PlanRecord | null | undefined, hadStorePlan: boolean): void {
    const store = this.planStore;
    if (!store || next === undefined) return;
    if (next === null) {
      store.setPlan(null);
      return;
    }
    const previous = store.getPlan();
    const known = previous != null || hadStorePlan;
    store.setPlan(next);
    store.addPlanBought(next.kind);
    if (!known || (previous != null && previous.productId !== next.productId)) {
      store.setPendingWelcome({ kind: next.kind, at: this.now() });
    }
  }
}
