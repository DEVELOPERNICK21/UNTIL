/**
 * useDailyQuests - today's three quests, rebuilt whenever tasks change.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDailyTaskStatsUseCase, observeDailyTasksUseCase } from '../../../app/di';
import { buildDailyQuests } from '../domain/dailyQuests';
import { usePresenceStreak } from '../../presence';
import { useTodayIso } from '../../../shared/hooks/useTodayIso';
import { useTranslation } from '../../../shared/i18n/useTranslation';

export function useDailyQuests() {
  const today = useTodayIso();
  const { streak } = usePresenceStreak();
  const { t } = useTranslation();
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

  // `t` is listed so the quest labels are rebuilt when the language changes.
  return useMemo(
    () =>
      buildDailyQuests(
        {
          noticedToday: streak.noticedToday,
          tasksTotal: stats.total,
          tasksCompleted: stats.completed,
        },
        t,
      ),
    [streak.noticedToday, stats.total, stats.completed, t],
  );
}
