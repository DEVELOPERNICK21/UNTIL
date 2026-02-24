import type { ITaskRepository } from '../repository/ITaskRepository';
import type {
  DailyTaskStats,
  DailyTaskWidgetPayload,
  TaskCategory,
} from '../../types';

const TASK_CATEGORIES: TaskCategory[] = [
  'health',
  'work',
  'personal_care',
  'learning',
  'other',
];

export class GetDailyTaskStatsUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(date: string): DailyTaskStats {
    const tasks = this.taskRepository.getTasksForDay(date);
    const completed = tasks.filter((t) => t.completed).length;
    const total = tasks.length;
    const pending = total - completed;

    const byCategory: DailyTaskStats['byCategory'] = {};
    for (const cat of TASK_CATEGORIES) {
      const catTasks = tasks.filter((t) => t.category === cat);
      if (catTasks.length > 0) {
        byCategory[cat] = {
          completed: catTasks.filter((t) => t.completed).length,
          total: catTasks.length,
        };
      }
    }

    return {
      date,
      completed,
      total,
      pending,
      byCategory,
    };
  }

  /** Returns payload shape for the widget (same data as DailyTaskStats). */
  getWidgetPayload(date: string): DailyTaskWidgetPayload {
    return this.execute(date);
  }
}
