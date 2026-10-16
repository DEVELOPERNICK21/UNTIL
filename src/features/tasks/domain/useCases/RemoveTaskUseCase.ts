import type { ITaskRepository } from '../ports/ITaskRepository';

export class RemoveTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(id: string): void {
    this.taskRepository.removeTask(id);
  }
}
