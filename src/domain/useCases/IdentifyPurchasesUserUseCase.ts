import type { IPurchasesRepository } from '../repository/IPurchasesRepository';
import type { SyncCustomerInfoUseCase } from './SyncCustomerInfoUseCase';

export class IdentifyPurchasesUserUseCase {
  constructor(
    private readonly purchases: IPurchasesRepository,
    private readonly sync: SyncCustomerInfoUseCase,
  ) {}

  async execute(uid: string): Promise<void> {
    const info = await this.purchases.logIn(uid);
    this.sync.execute(info);
  }
}
