/**
 * Counts that feed the badge snapshot from the task list (pure).
 */

import type { DailyTask } from '../../../shared/types';

/** A day only counts as "clean" with at least this many tasks. */
export const PERFECT_DAY_MIN_TASKS = 3;

type TaskDayRow = Pick<DailyTask, 'date' | 'completed'>;

export function countCompletedTasks(tasks: readonly TaskDayRow[]): number {
  return tasks.reduce((sum, t) => sum + (t.completed ? 1 : 0), 0);
}

/** Days with at least `minTasks` tasks where every task is done. */
export function countPerfectDays(
  tasks: readonly TaskDayRow[],
  minTasks: number = PERFECT_DAY_MIN_TASKS,
): number {
  const byDay = new Map<string, { total: number; done: number }>();
  for (const t of tasks) {
    const day = byDay.get(t.date) ?? { total: 0, done: 0 };
    day.total += 1;
    if (t.completed) day.done += 1;
    byDay.set(t.date, day);
  }
  let perfect = 0;
  byDay.forEach(day => {
    if (day.total >= minTasks && day.done === day.total) perfect += 1;
  });
  return perfect;
}
