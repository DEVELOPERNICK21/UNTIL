export type PurchasesPackageDTO = {
  identifier: string;
  productId: string;
  title: string;
  description: string;
  priceString: string;
  /** Store price as a number, in `currencyCode`. */
  price: number;
  /** ISO 4217 code of the store's price, e.g. USD, INR. */
  currencyCode: string;
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
  /** 'trial' or 'intro' for a store free trial or introductory price. Absent means a normal period. */
  periodType?: 'normal' | 'trial' | 'intro';
  store?: 'app_store' | 'play' | 'other';
  /** Set while the store reports a failed payment. */
  billingIssueDetectedAtMs?: number | null;
};

export type CustomerInfoDTO = {
  activeEntitlements: ActiveEntitlementDTO[];
  allPurchasedProductIds: string[];
  /**
   * Entitlements RevenueCat knows about that are no longer active (expired, refunded). Absent
   * means unknown, which is not the same as ended: an empty answer must never revoke Premium.
   */
  endedEntitlementIds?: string[];
};

/** The plan a person bought. Student is its own kind so the app can name it. */
export type PlanKind = 'weekly' | 'monthly' | 'yearly' | 'student' | 'lifetime';

/** What the store told us about the current plan, kept so the app can show it. */
export type PlanRecord = {
  kind: PlanKind;
  /** Store product id without the Play base-plan suffix. */
  productId: string;
  store: 'app_store' | 'play' | 'other' | null;
  startedMs: number | null;
  /** Null for a lifetime plan, or when the store gave no date. */
  expiresMs: number | null;
  willRenew: boolean;
  trial: boolean;
  billingIssue: boolean;
};

export type CustomerInfoSyncPlan = {
  setIsPremium: boolean;
  purchaseType: 'weekly' | 'monthly' | 'yearly' | 'lifetime' | null;
  purchaseDateMs: number | null;
  clearStorePurchaseFields: boolean;
  /** Record to keep: undefined leaves the stored plan alone, null clears it. */
  plan?: PlanRecord | null;
};
