/**
 * ReconcilePlayEntitlementUseCase — sync monthly/yearly entitlement with Play on resume.
 * Clears premium when no active subscription is returned (expired/canceled).
 */

import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import type { RestorePurchasesUseCase } from './RestorePurchasesUseCase';

export class ReconcilePlayEntitlementUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly restorePurchasesUseCase: RestorePurchasesUseCase,
    private readonly onChanged?: () => void
  ) {}

  async execute(): Promise<void> {
    const purchaseType = this.subscriptionRepository.getPurchaseType();
    if (purchaseType !== 'monthly' && purchaseType !== 'yearly') {
      return;
    }

    const { restored } = await this.restorePurchasesUseCase.execute();
    if (restored) {
      return;
    }

    this.subscriptionRepository.setIsPremium(false);
    this.subscriptionRepository.setPurchaseType(null);
    this.subscriptionRepository.setPurchaseDate(null);
    this.subscriptionRepository.setPurchaseToken(null);
    this.onChanged?.();
  }
}
