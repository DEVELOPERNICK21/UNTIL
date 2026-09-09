import type { ITaskRepository } from '../repository/ITaskRepository';

export class MoveTasksUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(ids: string[], date: string): void {
    for (const id of ids) {
      this.taskRepository.moveTask(id, date);
    }
  }
}
