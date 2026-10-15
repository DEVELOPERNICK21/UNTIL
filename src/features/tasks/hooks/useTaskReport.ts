import { useMemo } from 'react';
import {
  getDailyTaskStatsUseCase,
  getMonthlyTaskStatsUseCase,
  getWeeklyTaskStatsUseCase,
} from '../../../app/di';

export function useTaskReportStats(input: {
  today: string;
  now: Date;
  refreshKey: number;
}) {
  const { today, now, refreshKey } = input;

  const dailyStats = useMemo(
    () => getDailyTaskStatsUseCase.execute(today),
    // refreshKey re-reads the stats after a pull-to-refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, refreshKey]
  );
  const weeklyStats = useMemo(
    () => getWeeklyTaskStatsUseCase.execute(now),
    // refreshKey re-reads the stats after a pull-to-refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now, refreshKey]
  );
  const monthlyStats = useMemo(
    () => getMonthlyTaskStatsUseCase.execute(now.getFullYear(), now.getMonth() + 1),
    // refreshKey re-reads the stats after a pull-to-refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now, refreshKey]
  );

  return { dailyStats, weeklyStats, monthlyStats };
}
