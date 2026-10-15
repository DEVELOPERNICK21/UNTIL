import type { ITaskRepository } from '../ports/ITaskRepository';

export class ToggleTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(id: string): void {
    this.taskRepository.toggleTask(id);
  }
}
