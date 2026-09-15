/**
 * RestorePurchasesUseCase — restore store purchases via RevenueCat and sync MMKV.
 */

import { PREMIUM_ENTITLEMENT_ID } from '../billing/mapCustomerInfo';
import type { IPurchasesRepository } from '../repository/IPurchasesRepository';
import type { SyncCustomerInfoUseCase } from './SyncCustomerInfoUseCase';

export class RestorePurchasesUseCase {
  constructor(
    private readonly purchases: IPurchasesRepository,
    private readonly sync: SyncCustomerInfoUseCase,
  ) {}

  async execute(): Promise<{ restored: boolean }> {
    const info = await this.purchases.restorePurchases();
    this.sync.execute(info);
    const has = info.activeEntitlements.some(
      e => e.identifier === PREMIUM_ENTITLEMENT_ID,
    );
    return { restored: has };
  }
}
