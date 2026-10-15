import { useMemo } from 'react';
import {
  getHourCalculationState,
  syncHourCalculationWidget,
} from '../infrastructure/WidgetSync';

/** The hour-timer widget's state and its refresh, for the Hour calculation screen. */
export function useHourCalculationWidget() {
  return useMemo(() => ({ getHourCalculationState, syncHourCalculationWidget }), []);
}
