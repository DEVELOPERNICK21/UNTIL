import { useCallback, useState } from 'react';
import {
  addCountdownUseCase,
  getCountdownsUseCase,
  removeCountdownUseCase,
} from '../di';
import type { Countdown } from '../types';

export function useCountdowns(): {
  countdowns: Countdown[];
  refresh: () => void;
  addCountdown: (title: string, date: string) => void;
  removeCountdown: (id: string) => void;
} {
  const [countdowns, setCountdowns] = useState<Countdown[]>(() =>
    getCountdownsUseCase.execute()
  );

  const refresh = useCallback(() => {
    setCountdowns(getCountdownsUseCase.execute());
  }, []);

  const addCountdown = useCallback(
    (title: string, date: string) => {
      addCountdownUseCase.execute(title, date);
      refresh();
    },
    [refresh]
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
