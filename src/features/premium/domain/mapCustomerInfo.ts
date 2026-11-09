import type { CustomerInfoDTO, CustomerInfoSyncPlan } from '../../../shared/types/purchases';
import { productIdToPurchaseType } from './mapProductId';
import { planFromEntitlement } from './plan';

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
      plan: planFromEntitlement(premiumEntitlement) ?? undefined,
    };
  }

  if (opts.hasLicenseKey) {
    return {
      setIsPremium: true,
      purchaseType: null,
      purchaseDateMs: null,
      clearStorePurchaseFields: true,
      plan: null,
    };
  }

  /**
   * An empty answer (new sign-in, offline, a fresh anonymous id) keeps what is stored. Only
   * RevenueCat saying the entitlement has ended (expired, refunded) takes Premium away.
   */
  const storeEntitlementEnded =
    info.endedEntitlementIds?.includes(PREMIUM_ENTITLEMENT_ID) === true;
  if (opts.hasStorePurchase && !storeEntitlementEnded) {
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
    plan: null,
  };
}
