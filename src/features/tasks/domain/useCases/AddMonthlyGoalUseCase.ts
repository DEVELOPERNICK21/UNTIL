import type { IMonthlyGoalRepository } from '../ports/IMonthlyGoalRepository';
import type { MonthlyGoal } from '../../../../shared/types';

export class AddMonthlyGoalUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  execute(params: { month: string; title: string; targetDescription?: string }): MonthlyGoal {
    return this.goalRepository.addGoal({
      month: params.month,
      title: params.title,
      targetDescription: params.targetDescription,
    });
  }
}
