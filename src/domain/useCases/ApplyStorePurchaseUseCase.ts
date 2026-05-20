/**
 * ApplyStorePurchaseUseCase — verify with server when possible, then persist entitlement.
 */

import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import type { IPlayPurchaseVerificationService } from '../ports/IPlayPurchaseVerificationService';
import { productIdToPurchaseType } from '../billing/mapProductId';

const ANDROID_PACKAGE = 'app.until.time';

export interface StorePurchaseDTO {
  productId: string;
  purchaseToken: string | null;
  transactionDate: number;
}

export class ApplyStorePurchaseUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly verificationService: IPlayPurchaseVerificationService,
    private readonly onApplied?: () => void
  ) {}

  async execute(dto: StorePurchaseDTO): Promise<{ applied: boolean; error?: string }> {
    const purchaseType = productIdToPurchaseType(dto.productId);
    if (!purchaseType) {
      return { applied: false, error: 'Unknown product' };
    }

    if (dto.purchaseToken?.trim()) {
      const verification = await this.verificationService.verify({
        productId: dto.productId,
        purchaseToken: dto.purchaseToken.trim(),
        packageName: ANDROID_PACKAGE,
      });
      if (!verification.valid) {
        return {
          applied: false,
          error: verification.error ?? 'Purchase verification failed',
        };
      }
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
    return { applied: true };
  }
}
