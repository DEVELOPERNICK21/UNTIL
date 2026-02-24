import type { IMonthlyGoalRepository } from '../repository/IMonthlyGoalRepository';
import type { GoalTask } from '../../types';

export class AddGoalTaskUseCase {
  constructor(private readonly goalRepository: IMonthlyGoalRepository) {}

  execute(goalId: string, params: { title: string; category: GoalTask['category'] }): GoalTask {
    return this.goalRepository.addGoalTask(goalId, {
      title: params.title,
      category: params.category,
      order: 0, // repo will compute maxOrder+1
    });
  }
}
