/**
 * useDailyTasks - Returns tasks and stats for a date, with refresh and subscription
 */

import { useState, useEffect, useCallback } from 'react';
import {
  addTaskUseCase,
  getTasksForDayUseCase,
  getDailyTaskStatsUseCase,
  getGoalUseCase,
  observeDailyTasksUseCase,
  removeTaskUseCase,
  toggleTaskUseCase,
  updateTaskUseCase,
} from '../di';
import { logAnalyticsEvent } from '../services/analytics';
import type { DailyTask, DailyTaskStats } from '../types';

export function useDailyTasks(date: string) {
  const [tasks, setTasks] = useState<DailyTask[]>(() =>
    getTasksForDayUseCase.execute(date)
  );
  const [stats, setStats] = useState<DailyTaskStats>(() =>
    getDailyTaskStatsUseCase.execute(date)
  );

  const refresh = useCallback(() => {
    setTasks(getTasksForDayUseCase.execute(date));
    setStats(getDailyTaskStatsUseCase.execute(date));
  }, [date]);

  const addTask = useCallback(
    (task: Omit<DailyTask, 'id' | 'completed'>) => {
      addTaskUseCase.execute(task);
      refresh();
      void logAnalyticsEvent('task_added');
    },
    [refresh]
  );

  const toggleTask = useCallback(
    (id: string) => {
      const task = getTasksForDayUseCase.execute(date).find(t => t.id === id);
      toggleTaskUseCase.execute(id);
      refresh();
      if (task && !task.completed) {
        void logAnalyticsEvent('task_completed');
      }
    },
    [date, refresh]
  );

  const updateTask = useCallback(
    (
      id: string,
      patch: Partial<Pick<DailyTask, 'title' | 'category'>>
    ) => {
      updateTaskUseCase.execute(id, patch);
      refresh();
    },
    [refresh]
  );

  const removeTask = useCallback(
    (id: string) => {
      removeTaskUseCase.execute(id);
      refresh();
    },
    [refresh]
  );

  const getGoalTitle = useCallback((goalId: string): string | null => {
    return getGoalUseCase.execute(goalId)?.title ?? null;
  }, []);

  useEffect(() => {
    return observeDailyTasksUseCase.subscribe(refresh);
  }, [refresh]);

  return {
    tasks,
    stats,
    refresh,
    addTask,
    toggleTask,
    updateTask,
    removeTask,
    getGoalTitle,
  };
}
