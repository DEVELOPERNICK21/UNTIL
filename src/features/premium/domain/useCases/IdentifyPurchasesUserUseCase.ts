import type { IPurchasesRepository } from '../ports/IPurchasesRepository';
import type { SyncCustomerInfoUseCase } from './SyncCustomerInfoUseCase';

export class IdentifyPurchasesUserUseCase {
  constructor(
    private readonly purchases: IPurchasesRepository,
    private readonly sync: SyncCustomerInfoUseCase,
    /** Where the signed-in email is kept, so it can go to RevenueCat with the login. */
    private readonly session?: { getEmail(): string | null },
  ) {}

  async execute(uid: string): Promise<void> {
    const info = await this.purchases.logIn(uid);
    this.sync.execute(info);
    // After the login, so the email lands on the signed-in customer, not the anonymous one.
    if (this.session) this.purchases.setEmail(this.session.getEmail());
  }
}
