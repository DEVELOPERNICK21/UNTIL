import {
  isAutoReviewCooldownElapsed,
  isSustainedUseEligible,
} from '../../core/engagement';
import type { IInAppReviewService } from '../ports/IInAppReviewService';
import type { IEngagementRepository } from '../repository/IEngagementRepository';
import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';

export type InAppReviewSource = 'countdown' | 'opens' | 'settings';
export type AutoInAppReviewSource = Exclude<InAppReviewSource, 'settings'>;

export class MaybeRequestInAppReviewUseCase {
  constructor(
    private readonly reviewService: IInAppReviewService,
    private readonly engagementRepository: IEngagementRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly onEvent?: (
      name: 'review_requested',
      params: { source: AutoInAppReviewSource }
    ) => void
  ) {}

  async execute(input: {
    source: AutoInAppReviewSource;
    blockingOverlayVisible: boolean;
    todayDateKey: string;
    nowMs?: number;
  }): Promise<boolean> {
    const nowMs = input.nowMs ?? Date.now();

    if (input.blockingOverlayVisible) return false;

    if (
      !isAutoReviewCooldownElapsed(
        this.engagementRepository.getLastAutoReviewRequestAt(),
        nowMs
      )
    ) {
      return false;
    }

    if (input.source === 'countdown') {
      if (!this.engagementRepository.isReviewPending()) return false;
    } else if (
      !isSustainedUseEligible(
        this.subscriptionRepository.getAppOpenCount(),
        this.engagementRepository.getFirstOpenDate(),
        input.todayDateKey
      )
    ) {
      return false;
    }

    if (input.source === 'countdown') {
      this.engagementRepository.clearReviewPending();
    }

    if (!this.reviewService.isAvailable()) return false;

    try {
      await this.reviewService.requestReview();
      this.engagementRepository.setLastAutoReviewRequestAt(nowMs);
      this.onEvent?.('review_requested', { source: input.source });
      return true;
    } catch {
      return false;
    }
  }
}
