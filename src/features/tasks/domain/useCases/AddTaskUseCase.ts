import type { ITaskRepository } from '../ports/ITaskRepository';
import type { DailyTask } from '../../../../shared/types';

export class AddTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(task: Omit<DailyTask, 'id' | 'completed'>): DailyTask {
    return this.taskRepository.addTask(task);
  }
}
