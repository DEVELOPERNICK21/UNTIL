/**
 * No-op Play Billing when not on Android (or before native wiring).
 */

import type { IPlayBillingRepository } from '../../domain/repository/IPlayBillingRepository';

export class NoOpPlayBillingRepository implements IPlayBillingRepository {
  async initConnection(): Promise<void> {}

  async endConnection(): Promise<void> {}

  async getProducts(
    _productIds: string[]
  ): Promise<
    Array<{
      productId: string;
      title: string;
      description?: string;
      price: string;
      currency?: string;
    }>
  > {
    return [];
  }

  async requestPurchase(_productId: string): Promise<void> {}

  async restorePurchases(): Promise<
    Array<{ productId: string; purchaseToken?: string; transactionDate?: number }>
  > {
    return [];
  }
}
