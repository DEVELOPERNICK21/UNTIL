import type { ActivityCategory, RegretProjection, TimeBlock } from '../../types';

export interface InterventionResult {
  shouldShowRed: boolean;
  limitCrossed: boolean;
  message: string | null;
}

export interface IActivityAnalysisService {
  aggregateCategoryTotals(
    blocks: TimeBlock[],
    referenceTimeMs: number
  ): Record<ActivityCategory, number>;
  shouldIntervene(
    nothingHoursToday: number,
    dailyLimitHours: number
  ): InterventionResult;
  projectRegret(
    avgNothingHoursPerDay: number,
    birthDateIso: string,
    deathAge: number,
    targetAge?: number
  ): RegretProjection;
}
