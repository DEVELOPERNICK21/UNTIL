import type { IMonthlyGoalRepository } from '../repository/IMonthlyGoalRepository';

export class RemoveGoalTaskUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  execute(goalId: string, taskId: string): void {
    this.goalRepository.removeGoalTask(goalId, taskId);
  }
}
