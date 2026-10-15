import type { IMonthlyGoalRepository } from '../ports/IMonthlyGoalRepository';

export class IsRepeatDailyUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  execute(goalId: string, goalTaskId: string): boolean {
    return this.goalRepository.isRepeatDaily(goalId, goalTaskId);
  }
}
