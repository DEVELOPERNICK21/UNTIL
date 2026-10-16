/**
 * Widget sync port.
 *
 * The data features (time, tasks, countdowns, counters, account) tell the home-screen widgets that
 * something changed through this module. They never import the widgets feature, so the dependency
 * only points one way. The widgets feature registers the real implementation (WidgetSync) when the
 * composition root wires it up (app/di).
 */

export type WidgetSyncApi = {
  /** Rebuild and push the day/month/year/life widget cache. */
  syncWidgetCache(): void;
  /** Push the effective premium flag the native widgets gate on. */
  syncPremiumStatus(): void;
  syncDailyTasksWidget(): void;
  syncCustomCounters(): void;
  syncCountdowns(): void;
};

let implementation: WidgetSyncApi | null = null;

export function registerWidgetSync(next: WidgetSyncApi): void {
  implementation = next;
}

function api(): WidgetSyncApi {
  if (!implementation) {
    throw new Error('Widget sync used before the composition root registered it (app/di)');
  }
  return implementation;
}

export const widgetSync: WidgetSyncApi = {
  syncWidgetCache: () => api().syncWidgetCache(),
  syncPremiumStatus: () => api().syncPremiumStatus(),
  syncDailyTasksWidget: () => api().syncDailyTasksWidget(),
  syncCustomCounters: () => api().syncCustomCounters(),
  syncCountdowns: () => api().syncCountdowns(),
};
