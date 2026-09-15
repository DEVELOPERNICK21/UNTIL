import type { IPurchasesRepository } from '../repository/IPurchasesRepository';
import type { SyncCustomerInfoUseCase } from './SyncCustomerInfoUseCase';

export class ResetPurchasesUserUseCase {
  constructor(
    private readonly purchases: IPurchasesRepository,
    private readonly sync: SyncCustomerInfoUseCase,
  ) {}

  async execute(): Promise<void> {
    const info = await this.purchases.logOut();
    this.sync.execute(info);
  }
}
