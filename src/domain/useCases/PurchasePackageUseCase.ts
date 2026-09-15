import { isPurchaseCancelledError } from '../errors/purchasesErrors';
import type { IPurchasesRepository } from '../repository/IPurchasesRepository';
import type { SyncCustomerInfoUseCase } from './SyncCustomerInfoUseCase';

export type PurchasePackageResult =
  | { status: 'purchased' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export class PurchasePackageUseCase {
  constructor(
    private readonly purchases: IPurchasesRepository,
    private readonly sync: SyncCustomerInfoUseCase,
  ) {}

  async execute(productId: string): Promise<PurchasePackageResult> {
    try {
      const info = await this.purchases.purchaseProductId(productId);
      this.sync.execute(info);
      return { status: 'purchased' };
    } catch (error) {
      if (isPurchaseCancelledError(error)) {
        return { status: 'cancelled' };
      }
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }
}
