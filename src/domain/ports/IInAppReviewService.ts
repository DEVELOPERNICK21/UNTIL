/**
 * Port: native in-app review + store listing fallback.
 * Implemented by StoreReviewAdapter (Play / App Store).
 */
export interface IInAppReviewService {
  /** True when the native module is linked and callable. */
  isAvailable(): boolean;
  requestReview(): Promise<void>;
  openStoreListing(): Promise<void>;
}
