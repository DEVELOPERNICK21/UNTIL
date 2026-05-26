import type {
  IActivityAnalysisService,
  InterventionResult,
} from '../../domain/ports/IActivityAnalysisService';
import type { ActivityCategory, RegretProjection, TimeBlock } from '../../types';
import { aggregateCategoryTotals } from '../../core/activity/aggregate';
import { projectRegret } from '../../core/activity/projectRegret';
import { shouldIntervene } from '../../core/activity/intervention';

export class ActivityAnalysisAdapter implements IActivityAnalysisService {
  aggregateCategoryTotals(
    blocks: TimeBlock[],
    referenceTimeMs: number
  ): Record<ActivityCategory, number> {
    return aggregateCategoryTotals(blocks, referenceTimeMs);
  }

  shouldIntervene(
    nothingHoursToday: number,
    dailyLimitHours: number
  ): InterventionResult {
    return shouldIntervene(nothingHoursToday, dailyLimitHours);
  }

  projectRegret(
    avgNothingHoursPerDay: number,
    birthDateIso: string,
    deathAge: number,
    targetAge?: number
  ): RegretProjection {
    return projectRegret(
      avgNothingHoursPerDay,
      birthDateIso,
      deathAge,
      targetAge
    );
  }
}
