import { logAnalyticsEvent } from '../../services/analytics';
import type { IInAppReviewService } from '../ports/IInAppReviewService';

export class RequestInAppReviewFromSettingsUseCase {
  constructor(private readonly reviewService: IInAppReviewService) {}

  async execute(): Promise<void> {
    try {
      if (this.reviewService.isAvailable()) {
        await this.reviewService.requestReview();
        void logAnalyticsEvent('review_requested', { source: 'settings' });
        return;
      }
    } catch {
      // Fall through to the store listing.
    }

    try {
      await this.reviewService.openStoreListing();
      void logAnalyticsEvent('review_store_fallback', { source: 'settings' });
    } catch {
      // The fallback is best effort.
    }
  }
}
