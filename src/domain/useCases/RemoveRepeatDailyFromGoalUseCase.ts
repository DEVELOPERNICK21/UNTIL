import type { IMonthlyGoalRepository } from '../repository/IMonthlyGoalRepository';

/**
 * Stops a goal task from repeating daily. Does not remove existing daily task instances.
 */
export class RemoveRepeatDailyFromGoalUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  execute(goalId: string, goalTaskId: string): void {
    this.goalRepository.removeRepeatDailyRule(goalId, goalTaskId);
  }
}
