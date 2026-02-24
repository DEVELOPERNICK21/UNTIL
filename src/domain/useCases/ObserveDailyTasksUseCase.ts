/**
 * ObserveDailyTasksUseCase - Exposes subscription to task repository changes
 * so UI can refresh when tasks are added/toggled/removed.
 */

import type { ITaskRepository } from '../repository/ITaskRepository';

type Subscriber = () => void;

export class ObserveDailyTasksUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  subscribe(callback: Subscriber): () => void {
    return this.taskRepository.subscribe(callback);
  }
}
