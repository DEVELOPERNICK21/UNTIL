/**
 * useDailyQuests - today's three quests, rebuilt whenever tasks change.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDailyTaskStatsUseCase, observeDailyTasksUseCase } from '../di';
import { buildDailyQuests } from '../domain/badges/dailyQuests';
import { usePresenceStreak } from './usePresenceStreak';
import { useTodayIso } from './useTodayIso';

export function useDailyQuests() {
  const today = useTodayIso();
  const { streak } = usePresenceStreak();
  const [stats, setStats] = useState(() =>
    getDailyTaskStatsUseCase.execute(today),
  );

  const refresh = useCallback(() => {
    setStats(getDailyTaskStatsUseCase.execute(today));
  }, [today]);

  useEffect(() => {
    refresh();
    return observeDailyTasksUseCase.subscribe(refresh);
  }, [refresh]);

  return useMemo(
    () =>
      buildDailyQuests({
        noticedToday: streak.noticedToday,
        tasksTotal: stats.total,
        tasksCompleted: stats.completed,
      }),
    [streak.noticedToday, stats.total, stats.completed],
  );
}
