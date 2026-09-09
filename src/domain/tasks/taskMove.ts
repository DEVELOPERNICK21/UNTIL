import type { DailyTask } from '../../types';
import { formatDateToIso, parseDate } from '../../core/time/clock';
import { msUntilNextMidnight } from '../../core/time/projections';

export function addDaysIso(dateIso: string, days: number): string {
  const d = parseDate(dateIso);
  d.setDate(d.getDate() + days);
  return formatDateToIso(d);
}

export function isLastHourOfDay(now: Date = new Date()): boolean {
  return msUntilNextMidnight(now) < 60 * 60 * 1000;
}

export function shouldSkipMoveForGoalDuplicate(
  task: DailyTask,
  targetDayTasks: DailyTask[],
): boolean {
  if (task.sourceGoalId == null || task.sourceGoalTaskId == null) return false;
  return targetDayTasks.some(
    t =>
      t.id !== task.id &&
      t.sourceGoalId === task.sourceGoalId &&
      t.sourceGoalTaskId === task.sourceGoalTaskId,
  );
}

export function applyMoveTask(
  all: DailyTask[],
  id: string,
  newDate: string,
): DailyTask[] {
  const idx = all.findIndex(t => t.id === id);
  if (idx === -1) return all;
  const task = all[idx];
  if (task.date === newDate) return all;
  const targetDay = all.filter(t => t.date === newDate);
  if (shouldSkipMoveForGoalDuplicate(task, targetDay)) return all;
  const maxOrder = targetDay.reduce((m, t) => Math.max(m, t.order ?? 0), 0);
  const next = all.slice();
  next[idx] = { ...task, date: newDate, order: maxOrder + 1 };
  return next;
}
