import type { ITaskRepository } from '../repository/ITaskRepository';
import type { DailyTask } from '../../types';

/**
 * Returns only tasks already stored for a date.
 * Unlike GetTasksForDayUseCase, this does not materialize repeat-daily tasks.
 */
export class GetStoredTasksForDayUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(date: string): DailyTask[] {
    return this.taskRepository.getTasksForDay(date);
  }
}
