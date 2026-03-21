/**
 * TrackLifeScreenViewedUseCase — marks Life visited and grants 24h Life access window.
 */

import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import { LIFE_EVENT_UNLOCK_MS } from '../../config/accessConstants';

export class TrackLifeScreenViewedUseCase {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  execute(now: number = Date.now()): void {
    this.subscriptionRepository.setLifeScreenViewed(true);
    this.subscriptionRepository.setLifeUnlockUntil(now + LIFE_EVENT_UNLOCK_MS);
  }
}
