/**
 * TrackAppOpenUseCase — first-open trial start, app open count, 24h Life unlock after 3 opens.
 */

import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import { LIFE_EVENT_UNLOCK_MS } from '../../config/accessConstants';

export class TrackAppOpenUseCase {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  execute(now: number = Date.now()): void {
    if (this.subscriptionRepository.getTrialStartDate() == null) {
      this.subscriptionRepository.setTrialStartDate(now);
    }

    const count = this.subscriptionRepository.incrementAppOpenCount();
    if (count >= 3) {
      this.subscriptionRepository.setLifeUnlockUntil(now + LIFE_EVENT_UNLOCK_MS);
    }
  }
}
