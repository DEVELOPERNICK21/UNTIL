import type { ITaskRepository } from '../ports/ITaskRepository';
import type { DailyTask } from '../../../../shared/types';

export class UpdateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(id: string, patch: Partial<Pick<DailyTask, 'title' | 'category'>>): void {
    this.taskRepository.updateTask(id, patch);
  }
}
