/**
 * MmkvTaskRepository - MMKV-backed daily tasks.
 * Single array keyed by DAILY_TASKS; filter by date in getTasksForDay.
 */

import type { ITaskRepository } from '../../domain/repository/ITaskRepository';
import type { DailyTask } from '../../types';
import { STORAGE_KEYS } from '../../persistence/schema';
import { getString, setString } from '../../persistence/mmkv';

function randomId(): string {
  return Math.random().toString(36).slice(2, 12);
}

function loadAllTasks(): DailyTask[] {
  const raw = getString(STORAGE_KEYS.DAILY_TASKS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllTasks(tasks: DailyTask[]): void {
  setString(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(tasks));
}

type Subscriber = () => void;

export class MmkvTaskRepository implements ITaskRepository {
  private subscribers: Set<Subscriber> = new Set();

  getTasksForDay(date: string): DailyTask[] {
    const all = loadAllTasks();
    return all
      .filter((t) => t.date === date)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  addTask(task: Omit<DailyTask, 'id' | 'completed'>): DailyTask {
    const all = loadAllTasks();
    const dayTasks = all.filter((t) => t.date === task.date);
    const maxOrder = dayTasks.reduce((max, t) => Math.max(max, t.order ?? 0), 0);
    const newTask: DailyTask = {
      id: randomId(),
      date: task.date,
      title: (task.title || '').trim() || 'Task',
      category: task.category,
      completed: false,
      order: maxOrder + 1,
      ...(task.sourceGoalId != null && { sourceGoalId: task.sourceGoalId }),
      ...(task.sourceGoalTaskId != null && { sourceGoalTaskId: task.sourceGoalTaskId }),
    };
    all.push(newTask);
    saveAllTasks(all);
    this.notifySubscribers();
    return newTask;
  }

  updateTask(id: string, patch: Partial<Pick<DailyTask, 'title' | 'category'>>): void {
    const all = loadAllTasks();
    const idx = all.findIndex((t) => t.id === id);
    if (idx === -1) return;
    if (patch.title !== undefined) all[idx] = { ...all[idx], title: (patch.title || '').trim() || 'Task' };
    if (patch.category !== undefined) all[idx] = { ...all[idx], category: patch.category };
    saveAllTasks(all);
    this.notifySubscribers();
  }

  toggleTask(id: string): void {
    const all = loadAllTasks();
    const idx = all.findIndex((t) => t.id === id);
    if (idx === -1) return;
    all[idx] = { ...all[idx], completed: !all[idx].completed };
    saveAllTasks(all);
    this.notifySubscribers();
  }

  removeTask(id: string): void {
    const all = loadAllTasks().filter((t) => t.id !== id);
    saveAllTasks(all);
    this.notifySubscribers();
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => cb());
  }
}
