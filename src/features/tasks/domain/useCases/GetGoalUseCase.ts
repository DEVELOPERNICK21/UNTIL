import type { IMonthlyGoalRepository } from '../ports/IMonthlyGoalRepository';
import type { MonthlyGoal } from '../../../../shared/types';

export class GetGoalUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  execute(id: string): MonthlyGoal | null {
    return this.goalRepository.getGoal(id);
  }
}
