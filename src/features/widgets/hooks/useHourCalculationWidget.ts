import { useMemo } from 'react';
import {
  getHourCalculationState,
  syncHourCalculationWidget,
} from '../data/WidgetSync';
import { elapsedMs, formatElapsed, type HourTimerState } from '../domain/hourTimer';

/** The hour-timer widget's state and its changes, for the Hour calculation screen. */
export function useHourCalculationWidget() {
  return useMemo(
    () => ({
      getHourCalculationState,
      syncHourCalculationWidget,
      /** The clock as shown ("1:05:09"), counting the current run up to now. */
      elapsedLabel: (state: HourTimerState) => formatElapsed(elapsedMs(state, Date.now())),
      hasTime: (state: HourTimerState) => state.isRunning || elapsedMs(state, Date.now()) > 0,
    }),
    [],
  );
}
