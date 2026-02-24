import type { IMonthlyGoalRepository } from '../repository/IMonthlyGoalRepository';
import type { MonthlyGoal } from '../../types';

export class GetMonthlyGoalsUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  executeForMonth(month: string): MonthlyGoal[] {
    return this.goalRepository.getGoalsForMonth(month);
  }

  executeAll(): MonthlyGoal[] {
    return this.goalRepository.getAllGoals();
  }
}
