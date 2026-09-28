import type { ITaskRepository } from '../repository/ITaskRepository';

export class TaskCarryoverDismissalUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  getDismissedDate(): string | null {
    return this.taskRepository.getCarryoverDismissedDate();
  }

  dismiss(date: string): void {
    this.taskRepository.setCarryoverDismissedDate(date);
  }
}
