import { useMemo } from 'react';
import { widgetSync } from '../platform/widgetSync';

/** Lets a screen refresh the widgets after it changes tasks, counters or countdowns. */
export function useWidgetSyncActions() {
  return useMemo(
    () => ({
      syncDailyTasksWidget: widgetSync.syncDailyTasksWidget,
      syncCustomCounters: widgetSync.syncCustomCounters,
      syncCountdowns: widgetSync.syncCountdowns,
    }),
    [],
  );
}
