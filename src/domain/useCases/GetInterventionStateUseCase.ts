/**
 * GetInterventionStateUseCase - Premium-only intervention state
 */

import type { IActivityRepository } from '../repository/IActivityRepository';
import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import { formatDateToIso } from '../../core/time/clock';
import { shouldIntervene } from '../../core/activity/intervention';

export class GetInterventionStateUseCase {
  constructor(
    private readonly activityRepository: IActivityRepository,
    private readonly subscriptionRepository: ISubscriptionRepository
  ) {}

  execute(): import('../../core/activity/intervention').InterventionResult & { isPremium: boolean } {
    const isPremium = this.subscriptionRepository.getIsPremium();
    if (!isPremium) {
      return { shouldShowRed: false, limitCrossed: false, message: null, isPremium: false };
    }

    const dateIso = formatDateToIso(new Date());
    const totals = this.activityRepository.getCategoryTotals(dateIso, new Date().getFullYear());
    const nothingHours = totals.today.nothing;
    const limitHours = this.activityRepository.getDailyLimitNothing();

    const result = shouldIntervene(nothingHours, limitHours);
    return { ...result, isPremium: true };
  }
}
