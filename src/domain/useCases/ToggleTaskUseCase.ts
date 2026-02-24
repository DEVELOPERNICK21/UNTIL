import type { ITaskRepository } from '../repository/ITaskRepository';

export class ToggleTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(id: string): void {
    this.taskRepository.toggleTask(id);
  }
}
