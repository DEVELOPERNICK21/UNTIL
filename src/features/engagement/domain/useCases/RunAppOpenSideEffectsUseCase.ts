import { getLocalDateKey } from '../retentionNotificationCopy';
import type { ISubscriptionRepository } from '../../../premium/domain';
import type { IEngagementRepository } from '../ports/IEngagementRepository';
import type { TrackAppOpenUseCase } from './TrackAppOpenUseCase';
import type { CheckCountdownCompletionUseCase } from '../../../countdowns/domain';
import type { RecordPresenceUseCase } from '../../../presence/domain';

/**
 * App-open orchestration: trial/app-open tracking + engagement + presence streak.
 */
export class RunAppOpenSideEffectsUseCase {
  constructor(
    private readonly trackAppOpenUseCase: TrackAppOpenUseCase,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly engagementRepository: IEngagementRepository,
    private readonly checkCountdownCompletionUseCase: CheckCountdownCompletionUseCase,
    private readonly recordPresenceUseCase: RecordPresenceUseCase,
  ) {}

  execute(now: number = Date.now()): void {
    this.trackAppOpenUseCase.execute(now);
    this.engagementRepository.ensureFirstOpenDate(getLocalDateKey(new Date(now)));
    this.engagementRepository.scheduleFeatureCoachIfEligible(
      this.subscriptionRepository.getAppOpenCount(),
    );
    this.checkCountdownCompletionUseCase.execute();
    this.recordPresenceUseCase.execute(new Date(now));
  }
}
