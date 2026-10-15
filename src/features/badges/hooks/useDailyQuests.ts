/**
 * useDailyQuests - today's three quests, rebuilt whenever tasks change.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDailyTaskStatsUseCase, observeDailyTasksUseCase } from '../../../app/di';
import { buildDailyQuests } from '../domain/dailyQuests';
import { usePresenceStreak } from '../../presence';
import { useTodayIso } from '../../../shared/hooks/useTodayIso';

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
