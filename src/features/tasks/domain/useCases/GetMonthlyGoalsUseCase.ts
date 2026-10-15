import type { IMonthlyGoalRepository } from '../ports/IMonthlyGoalRepository';
import type { MonthlyGoal } from '../../../../shared/types';

export class GetMonthlyGoalsUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  executeForMonth(month: string): MonthlyGoal[] {
    return this.goalRepository.getGoalsForMonth(month);
  }

  executeAll(): MonthlyGoal[] {
    return this.goalRepository.getAllGoals();
  }
}
