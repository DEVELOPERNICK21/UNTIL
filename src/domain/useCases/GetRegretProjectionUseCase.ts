/**
 * GetRegretProjectionUseCase - Project current pattern to year and target age
 */

import type { IActivityRepository } from '../repository/IActivityRepository';
import type { ITimeRepository } from '../repository/ITimeRepository';
import type { IActivityAnalysisService } from '../ports/IActivityAnalysisService';
import type { IClock } from '../ports/IClock';

const DAYS_FOR_PATTERN = 7;

export class GetRegretProjectionUseCase {
  constructor(
    private readonly activityRepository: IActivityRepository,
    private readonly timeRepository: ITimeRepository,
    private readonly clock: IClock,
    private readonly activityAnalysis: IActivityAnalysisService
  ) {}

  execute(): { projection: import('../../types').RegretProjection | null; hasEnoughData: boolean } {
    const profile = this.timeRepository.getUserProfile();
    if (!profile.birthDate) return { projection: null, hasEnoughData: false };

    const now = new Date();
    let totalNothingHours = 0;
    let daysWithData = 0;

    for (let d = 0; d < DAYS_FOR_PATTERN; d++) {
      const dte = new Date(now);
      dte.setDate(dte.getDate() - d);
      const iso = this.clock.formatDateToIso(dte);
      const blocks = this.activityRepository.getBlocksForDate(iso);
      const refTime =
        iso === this.clock.formatDateToIso(now)
          ? this.clock.nowMs()
          : this.clock.endOfDayMs(dte);
      const totals = this.activityAnalysis.aggregateCategoryTotals(blocks, refTime);
      totalNothingHours += totals.nothing;
      if (blocks.length > 0) daysWithData += 1;
    }

    const hasEnoughData = daysWithData >= Math.min(3, DAYS_FOR_PATTERN);
    if (!hasEnoughData) return { projection: null, hasEnoughData: false };

    const avgNothingPerDay = totalNothingHours / DAYS_FOR_PATTERN;
    const deathAge = profile.deathAge ?? 80;
    const projection = this.activityAnalysis.projectRegret(
      avgNothingPerDay,
      profile.birthDate,
      deathAge,
      30
    );

    return { projection, hasEnoughData: true };
  }
}
