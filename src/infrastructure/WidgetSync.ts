/**
 * WidgetSync - Persists and bridges widget cache to native
 * SSOT: cache is produced by SyncWidgetUseCase (from TimeRepository); this layer only I/O
 */

import { NativeModules, Platform } from 'react-native';
import {
  syncWidgetUseCase,
  getCustomCountersUseCase,
  getCountdownsUseCase,
  getDailyTaskStatsUseCase,
} from '../di';
import { STORAGE_KEYS } from '../persistence/schema';
import { setString } from '../persistence/mmkv';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function syncWidgetCache(): void {
  const cache = syncWidgetUseCase.execute();
  const json = JSON.stringify(cache);
  setString(STORAGE_KEYS.WIDGET_CACHE, json);
  const { WidgetBridge } = NativeModules;
  if (Platform.OS === 'ios') {
    if (WidgetBridge?.setWidgetCache) {
      WidgetBridge.setWidgetCache(json);
    }
  } else if (WidgetBridge?.updateWidgets) {
    WidgetBridge.updateWidgets();
  }
}

/** Push custom counters to native so counter widgets can reload with latest data. */
export function syncCustomCounters(): void {
  const counters = getCustomCountersUseCase.execute();
  const json = JSON.stringify(counters);
  const { WidgetBridge } = NativeModules;
  if (Platform.OS === 'ios') {
    if (WidgetBridge?.setCustomCounters) {
      WidgetBridge.setCustomCounters(json);
    }
  } else if (WidgetBridge?.updateWidgets) {
    WidgetBridge.updateWidgets();
  }
}

/** Push countdowns to native so countdown widgets can reload. */
export function syncCountdowns(): void {
  const countdowns = getCountdownsUseCase.execute();
  const json = JSON.stringify(countdowns);
  const { WidgetBridge } = NativeModules;
  if (Platform.OS === 'ios') {
    if (WidgetBridge?.setCountdowns) {
      WidgetBridge.setCountdowns(json);
    }
  } else if (WidgetBridge?.updateWidgets) {
    WidgetBridge.updateWidgets();
  }
}

/** Push today's task stats to native for the daily tasks widget. */
export function syncDailyTasksWidget(): void {
  const payload = getDailyTaskStatsUseCase.getWidgetPayload(todayIso());
  const json = JSON.stringify(payload);
  setString(STORAGE_KEYS.DAILY_TASKS_WIDGET, json);
  const { WidgetBridge } = NativeModules;
  if (Platform.OS === 'ios') {
    if (WidgetBridge?.setDailyTasksStats) {
      WidgetBridge.setDailyTasksStats(json);
    }
  } else if (WidgetBridge?.updateWidgets) {
    WidgetBridge.updateWidgets();
  }
}
