import type { IMonthlyGoalRepository } from '../ports/IMonthlyGoalRepository';

export class UpdateMonthlyGoalUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  execute(
    id: string,
    patch: Partial<{ title: string; targetDescription: string; month: string }>
  ): void {
    this.goalRepository.updateGoal(id, patch);
  }
}
