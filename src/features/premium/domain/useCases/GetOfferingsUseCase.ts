import type { IPurchasesRepository } from '../ports/IPurchasesRepository';
import type { PurchasesOfferingDTO } from '../../../../shared/types/purchases';

export class GetOfferingsUseCase {
  constructor(private readonly purchases: IPurchasesRepository) {}

  execute(): Promise<PurchasesOfferingDTO | null> {
    return this.purchases.getOfferings();
  }
}
