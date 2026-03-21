/**
 * GetInterventionStateUseCase - Premium-only intervention state
 */

import type { IActivityRepository } from '../repository/IActivityRepository';
import { formatDateToIso } from '../../core/time/clock';
import { shouldIntervene } from '../../core/activity/intervention';
import type { GetAccessStateUseCase } from './GetAccessStateUseCase';
import { hasPremiumBundle } from '../accessControl';

export class GetInterventionStateUseCase {
  constructor(
    private readonly activityRepository: IActivityRepository,
    private readonly getAccessStateUseCase: GetAccessStateUseCase
  ) {}

  execute(): import('../../core/activity/intervention').InterventionResult & { isPremium: boolean } {
    const access = this.getAccessStateUseCase.execute();
    const entitled = hasPremiumBundle(access);
    if (!entitled) {
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
