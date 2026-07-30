/**
 * GetAccessStateUseCase — derives AccessState from subscription MMKV (SSOT inputs).
 */

import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import type { IAuthSessionRepository } from '../repository/IAuthSessionRepository';
import type { AccessState } from '../../types';
import { computeAccessState } from '../accessControl';

export class GetAccessStateUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly authSession: IAuthSessionRepository
  ) {}

  execute(now: number = Date.now()): AccessState {
    const signedIn = this.authSession.getUid() != null;
    return computeAccessState({
      now,
      isPremium: this.subscriptionRepository.getIsPremium(),
      purchaseType: this.subscriptionRepository.getPurchaseType(),
      purchaseDate: this.subscriptionRepository.getPurchaseDate(),
      trialStartDate: this.subscriptionRepository.getTrialStartDate(),
      appOpenCount: this.subscriptionRepository.getAppOpenCount(),
      lifeScreenViewed: this.subscriptionRepository.getLifeScreenViewed(),
      lifeUnlockUntil: this.subscriptionRepository.getLifeUnlockUntil(),
      signedIn,
      devicePremiumAllowed: signedIn
        ? this.authSession.getDevicePremiumAllowed()
        : true,
    });
  }
}
