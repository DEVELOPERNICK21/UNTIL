/**
 * RestorePurchasesUseCase — reconcile Play available purchases into MMKV entitlement.
 */

import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import type { IPlayBillingRepository } from '../repository/IPlayBillingRepository';
import { BILLING_PRODUCT_IDS } from '../../config/billing';
import { productIdToPurchaseType } from '../billing/mapProductId';

export class RestorePurchasesUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly playBillingRepository: IPlayBillingRepository,
    private readonly onApplied?: () => void
  ) {}

  async execute(): Promise<{ restored: boolean }> {
    await this.playBillingRepository.initConnection();
    const rows = await this.playBillingRepository.restorePurchases();
    const ours = rows.filter(r => productIdToPurchaseType(r.productId) != null);
    if (ours.length === 0) {
      return { restored: false };
    }

    const best = pickBestPurchaseRow(ours);
    if (!best) return { restored: false };

    const purchaseType = productIdToPurchaseType(best.productId);
    if (!purchaseType) return { restored: false };

    this.subscriptionRepository.setIsPremium(true);
    this.subscriptionRepository.setPurchaseType(purchaseType);
    this.subscriptionRepository.setPurchaseDate(
      best.transactionDate && best.transactionDate > 0
        ? best.transactionDate
        : Date.now()
    );
    if (best.purchaseToken) {
      this.subscriptionRepository.setPurchaseToken(best.purchaseToken);
    }

    this.onApplied?.();
    return { restored: true };
  }
}

function pickBestPurchaseRow(
  rows: Array<{ productId: string; purchaseToken?: string; transactionDate?: number }>
): (typeof rows)[0] | null {
  const rank = (id: string): number => {
    if (id === BILLING_PRODUCT_IDS.lifetime) return 3;
    if (id === BILLING_PRODUCT_IDS.yearly) return 2;
    if (id === BILLING_PRODUCT_IDS.monthly) return 1;
    return 0;
  };
  let best = rows[0];
  let bestR = rank(best.productId);
  for (let i = 1; i < rows.length; i++) {
    const r = rank(rows[i].productId);
    if (r > bestR) {
      best = rows[i];
      bestR = r;
    }
  }
  return bestR > 0 ? best : null;
}
