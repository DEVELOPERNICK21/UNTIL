import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import type { IEngagementRepository } from '../repository/IEngagementRepository';
import type { TrackAppOpenUseCase } from './TrackAppOpenUseCase';
import type { CheckCountdownCompletionUseCase } from './CheckCountdownCompletionUseCase';
import type { RecordPresenceUseCase } from './RecordPresenceUseCase';

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
    this.engagementRepository.scheduleFeatureCoachIfEligible(
      this.subscriptionRepository.getAppOpenCount(),
    );
    this.checkCountdownCompletionUseCase.execute();
    this.recordPresenceUseCase.execute(new Date(now));
  }
}
