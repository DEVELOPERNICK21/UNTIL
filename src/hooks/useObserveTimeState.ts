/**
 * useObserveTimeState - Subscribes to TimeRepository and polls for time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { observeTimeStateUseCase } from '../di';
import { widgetSync } from '../platform/widgetSync';

const POLL_INTERVAL_MS = 60000; // 60 seconds

export function useObserveTimeState() {
  const [state, setState] = useState(() => observeTimeStateUseCase.observe());

  const refresh = useCallback(() => {
    setState(observeTimeStateUseCase.observe());
    widgetSync.syncWidgetCache();
  }, []);

  useEffect(() => {
    const unsubscribe = observeTimeStateUseCase.subscribe(refresh);
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refresh]);

  return state;
}
