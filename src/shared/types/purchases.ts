export type PurchasesPackageDTO = {
  identifier: string;
  productId: string;
  title: string;
  description: string;
  priceString: string;
};

export type PurchasesOfferingDTO = {
  identifier: string;
  packages: PurchasesPackageDTO[];
};

export type ActiveEntitlementDTO = {
  identifier: string;
  productIdentifier: string;
  latestPurchaseDateMs: number | null;
  expirationDateMs: number | null;
  willRenew: boolean;
};

export type CustomerInfoDTO = {
  activeEntitlements: ActiveEntitlementDTO[];
  allPurchasedProductIds: string[];
};

export type CustomerInfoSyncPlan = {
  setIsPremium: boolean;
  purchaseType: 'weekly' | 'monthly' | 'yearly' | 'lifetime' | null;
  purchaseDateMs: number | null;
  clearStorePurchaseFields: boolean;
};
