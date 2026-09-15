/**
 * PresentRevenueCatPaywallUseCase — show dashboard RC paywall, then sync entitlement.
 */

import type { IPaywallPresenter } from '../repository/IPaywallPresenter';
import type { PaywallPresentResult } from '../repository/IPaywallPresenter';
import type { IPurchasesRepository } from '../repository/IPurchasesRepository';
import type { SyncCustomerInfoUseCase } from './SyncCustomerInfoUseCase';

export class PresentRevenueCatPaywallUseCase {
  constructor(
    private readonly presenter: IPaywallPresenter,
    private readonly purchases: IPurchasesRepository,
    private readonly sync: SyncCustomerInfoUseCase,
  ) {}

  async execute(options?: {
    onlyIfNeeded?: boolean;
  }): Promise<PaywallPresentResult> {
    const result = options?.onlyIfNeeded
      ? await this.presenter.presentIfNeeded()
      : await this.presenter.present();

    if (result === 'purchased' || result === 'restored') {
      try {
        const info = await this.purchases.getCustomerInfo();
        this.sync.execute(info);
      } catch {
        /* listener / next launch will sync */
      }
    }

    return result;
  }
}
