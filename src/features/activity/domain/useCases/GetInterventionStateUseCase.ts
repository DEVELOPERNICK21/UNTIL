/**
 * GetInterventionStateUseCase - Premium-only intervention state
 */

import type { IActivityRepository } from '../ports/IActivityRepository';
import type {
  IActivityAnalysisService,
  InterventionResult,
} from '../ports/IActivityAnalysisService';
import type { IClock } from '../../../../shared/time/IClock';
import type { GetAccessStateUseCase } from '../../../premium/domain';
import { hasPremiumBundle } from '../../../premium/domain';

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
