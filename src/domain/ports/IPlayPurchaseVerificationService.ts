export interface PurchaseVerificationRequest {
  productId: string;
  purchaseToken: string;
  packageName: string;
}

export interface PurchaseVerificationResult {
  valid: boolean;
  /** Server used Play Developer API */
  serverVerified?: boolean;
  error?: string;
}

export interface IPlayPurchaseVerificationService {
  verify(request: PurchaseVerificationRequest): Promise<PurchaseVerificationResult>;
}
