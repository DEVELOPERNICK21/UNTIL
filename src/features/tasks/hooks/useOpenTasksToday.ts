/**
 * useOpenTasksToday - today's tasks that are not done yet, first few only.
 * Read-only: for surfaces that point at one thing to do (Pause), not for editing the list.
 */

import { useMemo } from 'react';
import { useTodayIso } from '../../../shared/hooks/useTodayIso';
import type { DailyTask } from '../../../shared/types';
import { useDailyTasks } from './useDailyTasks';

export function useOpenTasksToday(limit: number = 3): DailyTask[] {
  const today = useTodayIso();
  const { tasks } = useDailyTasks(today);
  return useMemo(() => tasks.filter(task => !task.completed).slice(0, limit), [tasks, limit]);
}
