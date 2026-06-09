/**
 * GetInterventionStateUseCase - Premium-only intervention state
 */

import type { IActivityRepository } from '../repository/IActivityRepository';
import type {
  IActivityAnalysisService,
  InterventionResult,
} from '../ports/IActivityAnalysisService';
import type { IClock } from '../ports/IClock';
import type { GetAccessStateUseCase } from './GetAccessStateUseCase';
import { hasPremiumBundle } from '../accessControl';

export class GetInterventionStateUseCase {
  constructor(
    private readonly activityRepository: IActivityRepository,
    private readonly getAccessStateUseCase: GetAccessStateUseCase,
    private readonly clock: IClock,
    private readonly activityAnalysis: IActivityAnalysisService
  ) {}

  execute(): InterventionResult & { isPremium: boolean } {
    const access = this.getAccessStateUseCase.execute();
    const entitled = hasPremiumBundle(access);
    if (!entitled) {
      return { shouldShowRed: false, limitCrossed: false, message: null, isPremium: false };
    }

    const dateIso = this.clock.todayIso();
    const totals = this.activityRepository.getCategoryTotals(
      dateIso,
      this.clock.currentYear()
    );
    const nothingHours = totals.today.nothing;
    const limitHours = this.activityRepository.getDailyLimitNothing();

    const result = this.activityAnalysis.shouldIntervene(nothingHours, limitHours);
    return { ...result, isPremium: true };
  }
}
