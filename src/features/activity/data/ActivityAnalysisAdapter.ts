import type {
  IActivityAnalysisService,
  InterventionResult,
} from '../domain/ports/IActivityAnalysisService';
import type { ActivityCategory, RegretProjection, TimeBlock } from '../../../shared/types';
import { aggregateCategoryTotals } from '../domain/aggregate';
import { projectRegret } from '../domain/projectRegret';
import { shouldIntervene } from '../domain/intervention';

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
