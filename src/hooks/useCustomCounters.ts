import { useCallback, useState } from 'react';
import {
  addCustomCounterUseCase,
  getCustomCountersUseCase,
  removeCustomCounterUseCase,
} from '../di';
import type { CustomCounter } from '../types';

export function useCustomCounters(): {
  counters: CustomCounter[];
  refresh: () => void;
  addCounter: (title: string) => void;
  removeCounter: (id: string) => void;
} {
  const [counters, setCounters] = useState<CustomCounter[]>(() =>
    getCustomCountersUseCase.execute()
  );

  const refresh = useCallback(() => {
    setCounters(getCustomCountersUseCase.execute());
  }, []);

  const addCounter = useCallback(
    (title: string) => {
      addCustomCounterUseCase.execute(title);
      refresh();
    },
    [refresh]
  );

  const removeCounter = useCallback(
    (id: string) => {
      removeCustomCounterUseCase.execute(id);
      refresh();
    },
    [refresh]
  );

  return { counters, refresh, addCounter, removeCounter };
}
