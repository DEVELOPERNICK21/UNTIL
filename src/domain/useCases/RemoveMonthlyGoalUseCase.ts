import type { IMonthlyGoalRepository } from '../repository/IMonthlyGoalRepository';

export class RemoveMonthlyGoalUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  execute(id: string): void {
    this.goalRepository.removeGoal(id);
  }
}
