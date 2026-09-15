import type { IPurchasesRepository } from '../repository/IPurchasesRepository';
import { getRevenueCatApiKey } from '../../config/revenueCat';

export class ConfigurePurchasesUseCase {
  constructor(private readonly purchases: IPurchasesRepository) {}

  execute(): { configured: boolean } {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) return { configured: false };
    this.purchases.setDebugLogs(__DEV__);
    this.purchases.configure(apiKey);
    return { configured: true };
  }
}
