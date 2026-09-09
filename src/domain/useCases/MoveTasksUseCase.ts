import type { ITaskRepository } from '../repository/ITaskRepository';

export class MoveTasksUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(ids: string[], date: string): number {
    let movedCount = 0;
    for (const id of ids) {
      const wasOnTargetDay = this.taskRepository
        .getTasksForDay(date)
        .some(task => task.id === id);
      this.taskRepository.moveTask(id, date);
      const isOnTargetDay = this.taskRepository
        .getTasksForDay(date)
        .some(task => task.id === id);
      if (!wasOnTargetDay && isOnTargetDay) movedCount += 1;
    }
    return movedCount;
  }
}
