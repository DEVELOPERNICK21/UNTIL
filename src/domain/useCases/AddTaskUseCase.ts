import type { ITaskRepository } from '../repository/ITaskRepository';
import type { DailyTask } from '../../types';

export class AddTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(task: Omit<DailyTask, 'id' | 'completed'>): DailyTask {
    return this.taskRepository.addTask(task);
  }
}
