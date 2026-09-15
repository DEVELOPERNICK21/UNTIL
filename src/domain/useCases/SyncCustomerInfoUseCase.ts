import { mapCustomerInfoToSyncPlan } from '../billing/mapCustomerInfo';
import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import type { CustomerInfoDTO } from '../../types/purchases';

export class SyncCustomerInfoUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly onApplied?: () => void
  ) {}

  execute(info: CustomerInfoDTO): void {
    const plan = mapCustomerInfoToSyncPlan(info, {
      hasLicenseKey: Boolean(this.subscriptionRepository.getLicenseKey()?.trim()),
    });
    this.subscriptionRepository.setIsPremium(plan.setIsPremium);
    if (plan.clearStorePurchaseFields) {
      this.subscriptionRepository.setPurchaseType(null);
      this.subscriptionRepository.setPurchaseDate(null);
      this.subscriptionRepository.setPurchaseToken(null);
    } else {
      this.subscriptionRepository.setPurchaseType(plan.purchaseType);
      if (plan.purchaseDateMs != null) {
        this.subscriptionRepository.setPurchaseDate(plan.purchaseDateMs);
      }
    }
    this.onApplied?.();
  }
}
