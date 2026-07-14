import { useCallback, useState } from 'react';
import {
  addCountdownUseCase,
  getCountdownsUseCase,
  removeCountdownUseCase,
} from '../di';
import type { Countdown } from '../types';
import {
  formatSignedDaysUntil,
  getSignedDaysUntil,
} from '../core/countdown/daysLeft';
import { useAnalytics } from './useAnalytics';

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

export function useCountdowns(): {
  countdowns: CountdownRow[];
  refresh: () => void;
  addCountdown: (title: string, date: string) => void;
  removeCountdown: (id: string) => void;
} {
  const { logEvent } = useAnalytics();
  const [countdowns, setCountdowns] = useState<CountdownRow[]>(() =>
    getCountdownsUseCase.execute().map(toCountdownRow)
  );

  const refresh = useCallback(() => {
    setCountdowns(getCountdownsUseCase.execute().map(toCountdownRow));
  }, []);

  const addCountdown = useCallback(
    (title: string, date: string) => {
      addCountdownUseCase.execute(title, date);
      logEvent('countdown_created', {
        days_until: getSignedDaysUntil(date),
        has_custom_title:
          title.trim().length > 0 && title.trim() !== 'Deadline',
      });
      refresh();
    },
    [logEvent, refresh]
  );

  const removeCountdown = useCallback(
    (id: string) => {
      removeCountdownUseCase.execute(id);
      refresh();
    },
    [refresh]
  );

  return { countdowns, refresh, addCountdown, removeCountdown };
}
