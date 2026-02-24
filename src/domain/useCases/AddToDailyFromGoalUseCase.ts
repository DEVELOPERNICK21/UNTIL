import type { ITaskRepository } from '../repository/ITaskRepository';
import type { IMonthlyGoalRepository } from '../repository/IMonthlyGoalRepository';

/**
 * Adds a single instance of a goal task to a specific day (one-off). Does not set repeat daily.
 */
export class AddToDailyFromGoalUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly goalRepository: IMonthlyGoalRepository
  ) {}

  execute(goalId: string, goalTaskId: string, date: string): void {
    const goal = this.goalRepository.getGoal(goalId);
    if (!goal) return;
    const goalTask = goal.tasks.find((t) => t.id === goalTaskId);
    if (!goalTask) return;
    const existing = this.taskRepository.getTasksForDay(date);
    const alreadyThere = existing.some(
      (t) => t.sourceGoalId === goalId && t.sourceGoalTaskId === goalTaskId
    );
    if (alreadyThere) return;
    this.taskRepository.addTask({
      date,
      title: goalTask.title,
      category: goalTask.category,
      sourceGoalId: goalId,
      sourceGoalTaskId: goalTaskId,
    });
  }
}
