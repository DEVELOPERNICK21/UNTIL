import type { IMonthlyGoalRepository } from '../ports/IMonthlyGoalRepository';

export class RemoveMonthlyGoalUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  execute(id: string): void {
    this.goalRepository.removeGoal(id);
  }
}
