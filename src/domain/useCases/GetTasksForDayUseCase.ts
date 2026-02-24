import type { ITaskRepository } from '../repository/ITaskRepository';
import type { IMonthlyGoalRepository } from '../repository/IMonthlyGoalRepository';
import type { DailyTask } from '../../types';

/**
 * Returns tasks for a date. Before returning, materializes any "repeat daily"
 * goal tasks so they appear as normal daily tasks (without breaking existing flow).
 */
export class GetTasksForDayUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly monthlyGoalRepository: IMonthlyGoalRepository | null
  ) {}

  execute(date: string): DailyTask[] {
    if (this.monthlyGoalRepository) {
      this.materializeRepeatDailyForDate(date);
    }
    return this.taskRepository.getTasksForDay(date);
  }

  private materializeRepeatDailyForDate(date: string): void {
    const rules = this.monthlyGoalRepository!.getRepeatDailyRules();
    const existingTasks = this.taskRepository.getTasksForDay(date);
    for (const rule of rules) {
      const alreadyExists = existingTasks.some(
        (t) => t.sourceGoalId === rule.goalId && t.sourceGoalTaskId === rule.goalTaskId
      );
      if (alreadyExists) continue;
      const goal = this.monthlyGoalRepository!.getGoal(rule.goalId);
      if (!goal) continue;
      const goalTask = goal.tasks.find((t) => t.id === rule.goalTaskId);
      if (!goalTask) continue;
      this.taskRepository.addTask({
        date,
        title: goalTask.title,
        category: goalTask.category,
        sourceGoalId: rule.goalId,
        sourceGoalTaskId: rule.goalTaskId,
      });
      existingTasks.push({
        id: '',
        date,
        title: goalTask.title,
        category: goalTask.category,
        completed: false,
        sourceGoalId: rule.goalId,
        sourceGoalTaskId: rule.goalTaskId,
      } as DailyTask);
    }
  }
}
