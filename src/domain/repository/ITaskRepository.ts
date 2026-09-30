/**
 * ITaskRepository - Port for daily task list data.
 */

import type { DailyTask } from '../../types';

type Subscriber = () => void;

export interface ITaskRepository {
  getTasksForDay(date: string): DailyTask[];
  /** Every stored task, all days. For lifetime counts (badges). */
  getAllTasks(): DailyTask[];
  addTask(task: Omit<DailyTask, 'id' | 'completed'>): DailyTask;
  updateTask(id: string, patch: Partial<Pick<DailyTask, 'title' | 'category'>>): void;
  toggleTask(id: string): void;
  removeTask(id: string): void;
  moveTask(id: string, date: string): void;
  /** Day whose unfinished-task carryover prompt the user dismissed. */
  getCarryoverDismissedDate(): string | null;
  setCarryoverDismissedDate(date: string): void;
  subscribe(callback: Subscriber): () => void;
}
