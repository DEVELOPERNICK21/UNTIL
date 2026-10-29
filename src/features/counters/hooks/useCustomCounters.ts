import { useCallback, useState } from 'react';
import {
  addCustomCounterUseCase,
  decrementCustomCounterUseCase,
  getCustomCountersUseCase,
  incrementCustomCounterUseCase,
  removeCustomCounterUseCase,
  resetCustomCounterUseCase,
  showCounterOnWidgetUseCase,
} from '../../../app/di';
import type { CustomCounter } from '../../../shared/types';
import { useItemLimit } from '../../premium';

export function useCustomCounters(): {
  counters: CustomCounter[];
  /** True when the person cannot add another on their current plan. */
  atLimit: boolean;
  limit: number;
  hasPremium: boolean;
  refresh: () => void;
  /** False when the limit stopped it: nothing was added. */
  addCounter: (title: string) => boolean;
  removeCounter: (id: string) => void;
  incrementCounter: (id: string) => void;
  decrementCounter: (id: string) => void;
  resetCounter: (id: string) => void;
  showOnWidget: (id: string) => void;
} {
  const { limit, hasPremium } = useItemLimit();
  const [counters, setCounters] = useState<CustomCounter[]>(() =>
    getCustomCountersUseCase.execute()
  );

  const refresh = useCallback(() => {
    setCounters(getCustomCountersUseCase.execute());
  }, []);

  const addCounter = useCallback(
    (title: string): boolean => {
      const added = addCustomCounterUseCase.execute(title, limit);
      if (!added) return false;
      refresh();
      return true;
    },
    [limit, refresh]
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

  const showOnWidget = useCallback(
    (id: string) => {
      showCounterOnWidgetUseCase.execute(id);
      refresh();
    },
    [refresh]
  );

  return {
    counters,
    atLimit: counters.length >= limit,
    limit,
    hasPremium,
    refresh,
    addCounter,
    removeCounter,
    incrementCounter,
    decrementCounter,
    resetCounter,
    showOnWidget,
  };
}
