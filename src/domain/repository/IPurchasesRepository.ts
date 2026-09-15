import type {
  CustomerInfoDTO,
  PurchasesOfferingDTO,
} from '../../types/purchases';

export interface IPurchasesRepository {
  configure(apiKey: string): void;
  setDebugLogs(enabled: boolean): void;
  getOfferings(): Promise<PurchasesOfferingDTO | null>;
  purchaseProductId(productId: string): Promise<CustomerInfoDTO>;
  restorePurchases(): Promise<CustomerInfoDTO>;
  getCustomerInfo(): Promise<CustomerInfoDTO>;
  addCustomerInfoListener(listener: (info: CustomerInfoDTO) => void): () => void;
  logIn(appUserId: string): Promise<CustomerInfoDTO>;
  logOut(): Promise<CustomerInfoDTO>;
}
