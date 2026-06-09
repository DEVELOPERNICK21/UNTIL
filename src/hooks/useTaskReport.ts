import { useMemo } from 'react';
import {
  getDailyTaskStatsUseCase,
  getMonthlyTaskStatsUseCase,
  getWeeklyTaskStatsUseCase,
} from '../di';

export function useTaskReportStats(input: {
  today: string;
  now: Date;
  refreshKey: number;
}) {
  const { today, now, refreshKey } = input;

  const dailyStats = useMemo(
    () => getDailyTaskStatsUseCase.execute(today),
    [today, refreshKey]
  );
  const weeklyStats = useMemo(
    () => getWeeklyTaskStatsUseCase.execute(now),
    [now, refreshKey]
  );
  const monthlyStats = useMemo(
    () => getMonthlyTaskStatsUseCase.execute(now.getFullYear(), now.getMonth() + 1),
    [now, refreshKey]
  );

  return { dailyStats, weeklyStats, monthlyStats };
}
