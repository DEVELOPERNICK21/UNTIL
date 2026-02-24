import type { IMonthlyGoalRepository } from '../repository/IMonthlyGoalRepository';
import type { GoalTask } from '../../types';

export class UpdateGoalTaskUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  execute(
    goalId: string,
    taskId: string,
    patch: Partial<Pick<GoalTask, 'title' | 'category'>>
  ): void {
    this.goalRepository.updateGoalTask(goalId, taskId, patch);
  }
}
