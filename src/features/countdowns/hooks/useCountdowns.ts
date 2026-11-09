import { useCallback, useMemo, useState } from 'react';
import {
  addCountdownUseCase,
  getCountdownsUseCase,
  removeCountdownUseCase,
} from '../../../app/di';
import type { Countdown } from '../../../shared/types';
import {
  formatSignedDaysUntil,
  getSignedDaysUntil,
  parseLocalDate,
} from '../domain/daysLeft';
import { sortByUrgency } from '../domain/featured';
import { useAnalytics } from '../../../shared/analytics/useAnalytics';
import { useItemLimit } from '../../premium';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { t as translateFn } from '../../../shared/i18n/translate';

export type CountdownRow = Countdown & {
  daysUntil: number;
  daysLabel: string;
  /** The stored date as a local Date, for showing in the language's date format. */
  localDate: Date;
};

function toCountdownRow(
  countdown: Countdown,
  translate: typeof translateFn,
): CountdownRow {
  const daysUntil = getSignedDaysUntil(countdown.date);
  return {
    ...countdown,
    daysUntil,
    daysLabel: formatSignedDaysUntil(daysUntil, translate),
    localDate: parseLocalDate(countdown.date),
  };
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
  const { t } = useTranslation();
  const [stored, setStored] = useState<Countdown[]>(() =>
    getCountdownsUseCase.execute(),
  );
  // Nearest first, so the first row is the one the widget shows. The label is built here, not
  // stored, so it follows the language without a refresh.
  const countdowns = useMemo(
    () => sortByUrgency(stored).map(countdown => toCountdownRow(countdown, t)),
    [stored, t],
  );

  const refresh = useCallback(() => {
    setStored(getCountdownsUseCase.execute());
  }, []);

  const addCountdown = useCallback(
    (title: string, date: string): boolean => {
      const added = addCountdownUseCase.execute(title, date, limit);
      if (!added) return false;
      logEvent('countdown_created', {
        days_until: getSignedDaysUntil(date),
        has_custom_title:
          title.trim().length > 0 &&
          title.trim() !== t('countdowns.defaultTitle'),
        total: getCountdownsUseCase.execute().length,
      });
      refresh();
      return true;
    },
    [limit, logEvent, refresh, t],
  );

  const removeCountdown = useCallback(
    (id: string) => {
      removeCountdownUseCase.execute(id);
      refresh();
    },
    [refresh],
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
