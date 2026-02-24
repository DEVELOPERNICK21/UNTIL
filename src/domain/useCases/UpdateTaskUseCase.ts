import type { ITaskRepository } from '../repository/ITaskRepository';
import type { DailyTask } from '../../types';

export class UpdateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(id: string, patch: Partial<Pick<DailyTask, 'title' | 'category'>>): void {
    this.taskRepository.updateTask(id, patch);
  }
}
