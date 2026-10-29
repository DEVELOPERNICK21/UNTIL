import { useCallback, useState } from 'react';
import {
  addCountdownUseCase,
  getCountdownsUseCase,
  removeCountdownUseCase,
} from '../../../app/di';
import type { Countdown } from '../../../shared/types';
import {
  formatSignedDaysUntil,
  getSignedDaysUntil,
} from '../domain/daysLeft';
import { sortByUrgency } from '../domain/featured';
import { useAnalytics } from '../../../shared/analytics/useAnalytics';
import { useItemLimit } from '../../premium';

export type CountdownRow = Countdown & {
  daysUntil: number;
  daysLabel: string;
};

function toCountdownRow(countdown: Countdown): CountdownRow {
  const daysUntil = getSignedDaysUntil(countdown.date);
  return {
    ...countdown,
    daysUntil,
    daysLabel: formatSignedDaysUntil(daysUntil),
  };
}

/** Nearest first, so the first row is the one the widget shows. */
function loadRows(): CountdownRow[] {
  return sortByUrgency(getCountdownsUseCase.execute()).map(toCountdownRow);
}

export function useCountdowns(): {
  countdowns: CountdownRow[];
  /** True when the person cannot add another on their current plan. */
  atLimit: boolean;
  limit: number;
  hasPremium: boolean;
  refresh: () => void;
  /** False when the limit stopped it: nothing was added. */
  addCountdown: (title: string, date: string) => boolean;
  removeCountdown: (id: string) => void;
} {
  const { logEvent } = useAnalytics();
  const { limit, hasPremium } = useItemLimit();
  const [countdowns, setCountdowns] = useState<CountdownRow[]>(loadRows);

  const refresh = useCallback(() => {
    setCountdowns(loadRows());
  }, []);

  const addCountdown = useCallback(
    (title: string, date: string): boolean => {
      const added = addCountdownUseCase.execute(title, date, limit);
      if (!added) return false;
      logEvent('countdown_created', {
        days_until: getSignedDaysUntil(date),
        has_custom_title:
          title.trim().length > 0 && title.trim() !== 'Deadline',
        total: getCountdownsUseCase.execute().length,
      });
      refresh();
      return true;
    },
    [limit, logEvent, refresh]
  );

  const removeCountdown = useCallback(
    (id: string) => {
      removeCountdownUseCase.execute(id);
      refresh();
    },
    [refresh]
  );

  return {
    countdowns,
    atLimit: countdowns.length >= limit,
    limit,
    hasPremium,
    refresh,
    addCountdown,
    removeCountdown,
  };
}
