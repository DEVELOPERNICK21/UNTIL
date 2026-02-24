import type { ITaskRepository } from '../repository/ITaskRepository';

export class RemoveTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(id: string): void {
    this.taskRepository.removeTask(id);
  }
}
