import type { IMonthlyGoalRepository } from '../repository/IMonthlyGoalRepository';
import type { MonthlyGoal } from '../../types';

export class GetGoalUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  execute(id: string): MonthlyGoal | null {
    return this.goalRepository.getGoal(id);
  }
}
