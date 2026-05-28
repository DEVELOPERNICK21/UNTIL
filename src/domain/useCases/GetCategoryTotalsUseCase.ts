/**
 * GetCategoryTotalsUseCase - Get aggregated category totals for today and year
 */

import type { IActivityRepository } from '../repository/IActivityRepository';
import type { IClock } from '../ports/IClock';

export class GetCategoryTotalsUseCase {
  constructor(
    private readonly repository: IActivityRepository,
    private readonly clock: IClock
  ) {}

  execute(): ReturnType<IActivityRepository['getCategoryTotals']> {
    const dateIso = this.clock.todayIso();
    const year = this.clock.currentYear();
    return this.repository.getCategoryTotals(dateIso, year);
  }

  subscribe(callback: () => void): () => void {
    return this.repository.subscribe(callback);
  }
}
