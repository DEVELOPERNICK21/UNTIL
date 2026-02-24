/**
 * ITaskRepository - Port for daily task list data.
 */

import type { DailyTask } from '../../types';

type Subscriber = () => void;

export interface ITaskRepository {
  getTasksForDay(date: string): DailyTask[];
  addTask(task: Omit<DailyTask, 'id' | 'completed'>): DailyTask;
  updateTask(id: string, patch: Partial<Pick<DailyTask, 'title' | 'category'>>): void;
  toggleTask(id: string): void;
  removeTask(id: string): void;
  subscribe(callback: Subscriber): () => void;
}
