/**
 * useDailyTasks - Returns tasks and stats for a date, with refresh and subscription
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getTasksForDayUseCase,
  getDailyTaskStatsUseCase,
  observeDailyTasksUseCase,
} from '../di';
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

  useEffect(() => {
    return observeDailyTasksUseCase.subscribe(refresh);
  }, [refresh]);

  return { tasks, stats, refresh };
}
