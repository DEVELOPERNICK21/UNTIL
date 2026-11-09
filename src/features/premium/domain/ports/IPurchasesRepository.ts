import type {
  CustomerInfoDTO,
  PurchasesOfferingDTO,
} from '../../../../shared/types/purchases';

export interface IPurchasesRepository {
  configure(apiKey: string): void;
  setDebugLogs(enabled: boolean): void;
  getOfferings(): Promise<PurchasesOfferingDTO | null>;
  purchaseProductId(productId: string): Promise<CustomerInfoDTO>;
  restorePurchases(): Promise<CustomerInfoDTO>;
  getCustomerInfo(): Promise<CustomerInfoDTO>;
  addCustomerInfoListener(listener: (info: CustomerInfoDTO) => void): () => void;
  logIn(appUserId: string): Promise<CustomerInfoDTO>;
  /**
   * Tells RevenueCat the signed-in person's email (null clears it), so a customer can be found
   * by email in its dashboard. Best effort: a failure never blocks sign-in or a purchase.
   */
  setEmail(email: string | null): void;
  logOut(): Promise<CustomerInfoDTO>;
}
