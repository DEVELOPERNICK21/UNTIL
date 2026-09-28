import type { IPurchasesRepository } from '../repository/IPurchasesRepository';
import { getRevenueCatApiKey } from '../../config/revenueCat';

/**
 * RevenueCat's native SDK asserts (SIGTRAP) in release if configured with a
 * Test Store `test_` key. Refuse those keys outside __DEV__ so TestFlight /
 * App Store builds never call Purchases.configure with them.
 */
function isTestStoreApiKey(apiKey: string): boolean {
  return apiKey.startsWith('test_');
}

export class ConfigurePurchasesUseCase {
  constructor(private readonly purchases: IPurchasesRepository) {}

  execute(): { configured: boolean } {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) return { configured: false };
    if (!__DEV__ && isTestStoreApiKey(apiKey)) {
      console.error(
        '[RevenueCat] Refusing Test Store API key in release. Use appl_ (iOS) / goog_ (Android).'
      );
      return { configured: false };
    }
    this.purchases.setDebugLogs(__DEV__);
    this.purchases.configure(apiKey);
    return { configured: true };
  }
}
