import { useMemo } from 'react';
import {
  syncDailyTasksWidget,
  syncCustomCounters,
  syncCountdowns,
  getHourCalculationState,
  syncHourCalculationWidget,
} from '../infrastructure/WidgetSync';

export function useWidgetSyncActions() {
  return useMemo(
    () => ({
      syncDailyTasksWidget,
      syncCustomCounters,
      syncCountdowns,
      getHourCalculationState,
      syncHourCalculationWidget,
    }),
    [],
  );
}
