/**
 * ApplyStorePurchaseUseCase — persist Play purchase result to MMKV (client-trusted).
 * Call finishTransaction in infrastructure after this succeeds.
 */

import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import { productIdToPurchaseType } from '../billing/mapProductId';

export interface StorePurchaseDTO {
  productId: string;
  purchaseToken: string | null;
  transactionDate: number;
}

export class ApplyStorePurchaseUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly onApplied?: () => void
  ) {}

  execute(dto: StorePurchaseDTO): void {
    const purchaseType = productIdToPurchaseType(dto.productId);
    if (!purchaseType) {
      return;
    }

    this.subscriptionRepository.setIsPremium(true);
    this.subscriptionRepository.setPurchaseType(purchaseType);
    this.subscriptionRepository.setPurchaseDate(
      dto.transactionDate > 0 ? dto.transactionDate : Date.now()
    );
    if (dto.purchaseToken) {
      this.subscriptionRepository.setPurchaseToken(dto.purchaseToken);
    }

    this.onApplied?.();
  }
}
