import type { ITaskRepository } from '../repository/ITaskRepository';
import type { IMonthlyGoalRepository } from '../repository/IMonthlyGoalRepository';

/**
 * Marks a goal task as "repeat daily". From now on it will be materialized into each day's task list.
 * Also ensures today has one instance (materialize or add one-off).
 */
export class SetRepeatDailyFromGoalUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly goalRepository: IMonthlyGoalRepository
  ) {}

  execute(goalId: string, goalTaskId: string, todayIso: string): void {
    this.goalRepository.addRepeatDailyRule({ goalId, goalTaskId });
    // Ensure today has the task (GetTasksForDayUseCase will do this on next read, but we can add explicitly so widget/UI refresh immediately)
    const goal = this.goalRepository.getGoal(goalId);
    if (!goal) return;
    const goalTask = goal.tasks.find((t) => t.id === goalTaskId);
    if (!goalTask) return;
    const existing = this.taskRepository.getTasksForDay(todayIso);
    const alreadyThere = existing.some(
      (t) => t.sourceGoalId === goalId && t.sourceGoalTaskId === goalTaskId
    );
    if (!alreadyThere) {
      this.taskRepository.addTask({
        date: todayIso,
        title: goalTask.title,
        category: goalTask.category,
        sourceGoalId: goalId,
        sourceGoalTaskId: goalTaskId,
      });
    }
  }
}
