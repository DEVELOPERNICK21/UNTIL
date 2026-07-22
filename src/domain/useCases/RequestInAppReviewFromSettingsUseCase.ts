import type { IInAppReviewService } from '../ports/IInAppReviewService';

export class RequestInAppReviewFromSettingsUseCase {
  constructor(
    private readonly reviewService: IInAppReviewService,
    private readonly onEvent?: (
      name: 'review_requested' | 'review_store_fallback',
      params: { source: 'settings' }
    ) => void
  ) {}

  async execute(): Promise<void> {
    try {
      if (this.reviewService.isAvailable()) {
        await this.reviewService.requestReview();
        this.onEvent?.('review_requested', { source: 'settings' });
        return;
      }
    } catch {
      // Fall through to the store listing.
    }

    try {
      await this.reviewService.openStoreListing();
      this.onEvent?.('review_store_fallback', { source: 'settings' });
    } catch {
      // The fallback is best effort.
    }
  }
}
