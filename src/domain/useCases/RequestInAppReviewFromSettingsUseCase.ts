import type { IInAppReviewService } from '../ports/IInAppReviewService';

/**
 * Settings "Rate UNTIL" must open the public store listing.
 * In-app review is for unsolicited prompts only: the OS may no-op, and
 * Google/Apple tell you not to call it from a Rate button.
 */
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
      await this.reviewService.openStoreListing();
      this.onEvent?.('review_store_fallback', { source: 'settings' });
    } catch {
      // The listing open is best effort.
    }
  }
}
