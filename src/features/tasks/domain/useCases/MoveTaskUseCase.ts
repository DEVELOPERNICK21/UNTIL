import type { ITaskRepository } from '../ports/ITaskRepository';

export class MoveTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(id: string, date: string): void {
    this.taskRepository.moveTask(id, date);
  }
}
