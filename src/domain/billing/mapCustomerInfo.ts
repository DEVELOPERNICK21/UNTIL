import type { CustomerInfoDTO, CustomerInfoSyncPlan } from '../../types/purchases';
import { productIdToPurchaseType } from './mapProductId';

export const PREMIUM_ENTITLEMENT_ID = 'premium';

export function mapCustomerInfoToSyncPlan(
  info: CustomerInfoDTO,
  opts: { hasLicenseKey: boolean; hasStorePurchase: boolean }
): CustomerInfoSyncPlan {
  const premiumEntitlement = info.activeEntitlements.find(
    (e) => e.identifier === PREMIUM_ENTITLEMENT_ID
  );

  if (premiumEntitlement) {
    return {
      setIsPremium: true,
      purchaseType: productIdToPurchaseType(premiumEntitlement.productIdentifier),
      purchaseDateMs: premiumEntitlement.latestPurchaseDateMs,
      clearStorePurchaseFields: false,
    };
  }

  if (opts.hasLicenseKey) {
    return {
      setIsPremium: true,
      purchaseType: null,
      purchaseDateMs: null,
      clearStorePurchaseFields: true,
    };
  }

  if (opts.hasStorePurchase) {
    return {
      setIsPremium: true,
      purchaseType: null,
      purchaseDateMs: null,
      clearStorePurchaseFields: false,
    };
  }

  return {
    setIsPremium: false,
    purchaseType: null,
    purchaseDateMs: null,
    clearStorePurchaseFields: true,
  };
}
