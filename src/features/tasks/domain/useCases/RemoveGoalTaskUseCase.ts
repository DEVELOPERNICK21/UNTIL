import type { IMonthlyGoalRepository } from '../ports/IMonthlyGoalRepository';

export class RemoveGoalTaskUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  execute(goalId: string, taskId: string): void {
    this.goalRepository.removeGoalTask(goalId, taskId);
  }
}
