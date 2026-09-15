import type { IPurchasesRepository } from '../repository/IPurchasesRepository';
import type { PurchasesOfferingDTO } from '../../types/purchases';

export class GetOfferingsUseCase {
  constructor(private readonly purchases: IPurchasesRepository) {}

  execute(): Promise<PurchasesOfferingDTO | null> {
    return this.purchases.getOfferings();
  }
}
