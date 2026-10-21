import { useCallback, useState } from 'react';
import {
  addCustomCounterUseCase,
  decrementCustomCounterUseCase,
  getCustomCountersUseCase,
  incrementCustomCounterUseCase,
  removeCustomCounterUseCase,
  resetCustomCounterUseCase,
} from '../../../app/di';
import type { CustomCounter } from '../../../shared/types';

export function useCustomCounters(): {
  counters: CustomCounter[];
  refresh: () => void;
  addCounter: (title: string) => void;
  removeCounter: (id: string) => void;
  incrementCounter: (id: string) => void;
  decrementCounter: (id: string) => void;
  resetCounter: (id: string) => void;
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

  const incrementCounter = useCallback(
    (id: string) => {
      incrementCustomCounterUseCase.execute(id);
      refresh();
    },
    [refresh]
  );

  const decrementCounter = useCallback(
    (id: string) => {
      decrementCustomCounterUseCase.execute(id);
      refresh();
    },
    [refresh]
  );

  const resetCounter = useCallback(
    (id: string) => {
      resetCustomCounterUseCase.execute(id);
      refresh();
    },
    [refresh]
  );

  return {
    counters,
    refresh,
    addCounter,
    removeCounter,
    incrementCounter,
    decrementCounter,
    resetCounter,
  };
}
