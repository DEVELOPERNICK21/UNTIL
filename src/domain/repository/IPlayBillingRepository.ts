/**
 * IPlayBillingRepository - Port for Google Play Billing (Android).
 *
 * This is intentionally narrow: the app's SSOT for entitlement is stored in
 * ISubscriptionRepository/MMKV; this repository only performs store operations
 * (fetch products, purchase, restore) and returns purchase metadata for syncing.
 */
export interface IPlayBillingRepository {
  initConnection(): Promise<void>;
  endConnection(): Promise<void>;

  /** Fetch subscription + one-time product details used by the paywall. */
  getProducts(productIds: string[]): Promise<Array<{
    productId: string;
    title: string;
    description?: string;
    price: string; // formatted price from Play
    currency?: string;
  }>>;

  /** Request a purchase/subscription for a given product id. */
  requestPurchase(productId: string): Promise<void>;

  /**
   * Restore available purchases from Play.
   * Returns purchased productIds and raw tokens for future server validation.
   */
  restorePurchases(): Promise<Array<{ productId: string; purchaseToken?: string; transactionDate?: number }>>;
}

