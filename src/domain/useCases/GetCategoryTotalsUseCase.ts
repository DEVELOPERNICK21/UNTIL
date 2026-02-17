/**
 * GetCategoryTotalsUseCase - Get aggregated category totals for today and year
 */

import type { IActivityRepository } from '../repository/IActivityRepository';
import { formatDateToIso } from '../../core/time/clock';

export class GetCategoryTotalsUseCase {
  constructor(private readonly repository: IActivityRepository) {}

  execute(): ReturnType<IActivityRepository['getCategoryTotals']> {
    const now = new Date();
    const dateIso = formatDateToIso(now);
    const year = now.getFullYear();
    return this.repository.getCategoryTotals(dateIso, year);
  }

  subscribe(callback: () => void): () => void {
    return this.repository.subscribe(callback);
  }
}
