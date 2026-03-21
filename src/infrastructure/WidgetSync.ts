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
  observeSubscriptionUseCase,
} from '../di';
import { STORAGE_KEYS } from '../persistence/schema';
import {
  getString,
  setString,
  getNumber,
  getBoolean,
  setBoolean,
} from '../persistence/mmkv';
import { TRIAL_DURATION_MS } from '../config/accessConstants';

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
/** Sync premium status to native for widget gating. iOS: UserDefaults; Android: MMKV (already shared). */
/**
 * Trial unlocks the same widget surfaces as paid premium on iOS (UserDefaults bridge).
 * Uses MMKV + shared constant only — avoids importing di (circular with billing wiring).
 */
function readEffectivePremiumForNativeBridge(): boolean {
  const { isPremium } = observeSubscriptionUseCase.observe();
  if (isPremium) return true;
  const trialStart = getNumber(STORAGE_KEYS.TRIAL_START_DATE);
  if (trialStart == null || trialStart <= 0) return false;
  return Date.now() <= trialStart + TRIAL_DURATION_MS;
}

export function syncPremiumStatus(): void {
  const effectivePremium = readEffectivePremiumForNativeBridge();
  const { WidgetBridge } = NativeModules;
  if (Platform.OS === 'ios' && WidgetBridge?.setPremiumStatus) {
    WidgetBridge.setPremiumStatus(effectivePremium);
  } else if (Platform.OS === 'android' && WidgetBridge?.updateWidgets) {
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

export type HourCalculationState = {
  title: string;
  isRunning: boolean;
  startTimeMs: number;
  totalElapsedMs: number;
};

const DEFAULT_HOUR_CALCULATION: HourCalculationState = {
  title: 'Hour timer',
  isRunning: false,
  startTimeMs: 0,
  totalElapsedMs: 0,
};

/** Read hour calculation widget state from storage (same key as native). */
export function getHourCalculationState(): HourCalculationState {
  const json = getString(STORAGE_KEYS.HOUR_CALCULATION_WIDGET);
  if (!json) return DEFAULT_HOUR_CALCULATION;
  try {
    const o = JSON.parse(json);
    return {
      title:
        typeof o.title === 'string' ? o.title : DEFAULT_HOUR_CALCULATION.title,
      isRunning: Boolean(o.isRunning),
      startTimeMs: Number(o.startTimeMs) || 0,
      totalElapsedMs: Number(o.totalElapsedMs) || 0,
    };
  } catch {
    return DEFAULT_HOUR_CALCULATION;
  }
}

export type LiveActivityWidgetType =
  | 'day'
  | 'month'
  | 'year'
  | 'life'
  | 'dailyTasks'
  | 'hourCalc';

const LIVE_ACTIVITY_WIDGET_TYPES: LiveActivityWidgetType[] = [
  'day',
  'month',
  'year',
  'life',
  'dailyTasks',
  'hourCalc',
];

/** Android overlay widget type (same options as Live Activity). */
export type OverlayWidgetType = LiveActivityWidgetType;

/** Get stored Live Activity widget type. */
export function getLiveActivityWidgetType(): LiveActivityWidgetType {
  const stored = getString(STORAGE_KEYS.LIVE_ACTIVITY_WIDGET_TYPE);
  if (
    stored &&
    LIVE_ACTIVITY_WIDGET_TYPES.includes(stored as LiveActivityWidgetType)
  ) {
    return stored as LiveActivityWidgetType;
  }
  return 'day';
}

/** Set Live Activity widget type and persist. */
export function setLiveActivityWidgetType(type: LiveActivityWidgetType): void {
  setString(STORAGE_KEYS.LIVE_ACTIVITY_WIDGET_TYPE, type);
}

/** Build Live Activity state from all widget sources. Used for Dynamic Island / Lock Screen. */
export function buildLiveActivityState(
  activeWidget?: LiveActivityWidgetType,
): object {
  const widget = activeWidget ?? getLiveActivityWidgetType();
  const cache = syncWidgetUseCase.execute();
  const dailyPayload = getDailyTaskStatsUseCase.getWidgetPayload(todayIso());
  const hourState = getHourCalculationState();

  return {
    activeWidget: widget,
    dayProgress: cache.dayProgress,
    dayPercentDone: cache.dayPercentDone,
    dayPercentLeft: cache.dayPercentLeft,
    dayHoursPassed: cache.dayHoursPassed,
    dayHoursLeft: cache.dayHoursLeft,
    startOfDay: cache.startOfDay ?? null,
    endOfDay: cache.endOfDay ?? null,
    monthProgress: cache.monthProgress,
    monthDaysPassed: cache.monthDaysPassed,
    monthDaysLeft: cache.monthDaysLeft,
    monthPercent: cache.monthPercent,
    yearProgress: cache.yearProgress,
    yearDaysPassed: cache.yearDaysPassed,
    yearDaysLeft: cache.yearDaysLeft,
    yearPercent: cache.yearPercent,
    lifeProgress: cache.lifeProgress ?? null,
    remainingDaysLife: cache.remainingDaysLife ?? null,
    lifePercent: cache.lifePercent ?? null,
    dailyTasksCompleted: dailyPayload?.completed ?? 0,
    dailyTasksTotal: dailyPayload?.total ?? 0,
    hourCalcTitle: hourState.title || 'Hour timer',
    hourCalcElapsedMs: hourState.totalElapsedMs,
    hourCalcIsRunning: hourState.isRunning,
    updatedAt: Date.now(),
  };
}

/** Sync Live Activity (Dynamic Island / Lock Screen). Start or update. iOS only. */
export function syncLiveActivity(activeWidget?: LiveActivityWidgetType): void {
  if (Platform.OS !== 'ios') return;
  const LiveActivityBridge = NativeModules.LiveActivityBridge;
  if (!LiveActivityBridge?.startActivity) return;

  const state = buildLiveActivityState(activeWidget);
  const json = JSON.stringify(state);
  LiveActivityBridge.startActivity(json);
}

/** Update existing Live Activity. Call when app foregrounds. */
export function updateLiveActivity(
  activeWidget?: LiveActivityWidgetType,
): void {
  if (Platform.OS !== 'ios') return;
  const LiveActivityBridge = NativeModules.LiveActivityBridge;
  if (!LiveActivityBridge?.updateActivity) return;

  const state = buildLiveActivityState(activeWidget);
  const json = JSON.stringify(state);
  LiveActivityBridge.updateActivity(json);
}

/** End Live Activity. */
export function endLiveActivity(): void {
  if (Platform.OS !== 'ios') return;
  const LiveActivityBridge = NativeModules.LiveActivityBridge;
  if (LiveActivityBridge?.endActivity) {
    LiveActivityBridge.endActivity();
  }
}

// --- Android floating overlay (Dynamic Island–like) ---

/** Get stored overlay widget type. Android only. */
export function getOverlayWidgetType(): OverlayWidgetType {
  if (Platform.OS !== 'android') return 'day';
  const stored = getString(STORAGE_KEYS.OVERLAY_WIDGET_TYPE);
  if (
    stored &&
    LIVE_ACTIVITY_WIDGET_TYPES.includes(stored as OverlayWidgetType)
  ) {
    return stored as OverlayWidgetType;
  }
  return 'day';
}

/** Set overlay widget type and persist to MMKV. Android only. */
export function setOverlayWidgetType(type: OverlayWidgetType): void {
  if (Platform.OS !== 'android') return;
  setString(STORAGE_KEYS.OVERLAY_WIDGET_TYPE, type);
}

/** Start floating overlay. Android only. Requires overlay permission. */
export function startOverlay(): void {
  if (Platform.OS !== 'android') return;
  setBoolean(STORAGE_KEYS.OVERLAY_ENABLED, true);
  const { WidgetBridge } = NativeModules;
  if (WidgetBridge?.startOverlay) {
    WidgetBridge.startOverlay();
  }
}

/** Stop floating overlay. Android only. */
export function stopOverlay(): void {
  if (Platform.OS !== 'android') return;
  setBoolean(STORAGE_KEYS.OVERLAY_ENABLED, false);
  const { WidgetBridge } = NativeModules;
  if (WidgetBridge?.stopOverlay) {
    WidgetBridge.stopOverlay();
  }
}

/** Check if overlay is enabled (user has started it). Android only. */
export function isOverlayEnabled(): boolean {
  if (Platform.OS !== 'android') return false;
  return getBoolean(STORAGE_KEYS.OVERLAY_ENABLED) ?? false;
}

/** Update overlay content. Call when cache changes. Android only. */
export function updateOverlay(): void {
  if (Platform.OS !== 'android') return;
  const { WidgetBridge } = NativeModules;
  if (WidgetBridge?.updateOverlay) {
    WidgetBridge.updateOverlay();
  }
}

/** Check if overlay permission is granted. Android only. */
export function canDrawOverlays(): Promise<boolean> {
  if (Platform.OS !== 'android') return Promise.resolve(false);
  const { WidgetBridge } = NativeModules;
  if (WidgetBridge?.canDrawOverlays) {
    return WidgetBridge.canDrawOverlays();
  }
  return Promise.resolve(false);
}

/** Open overlay permission settings. Android only. */
export function requestOverlayPermission(): void {
  if (Platform.OS !== 'android') return;
  const { WidgetBridge } = NativeModules;
  if (WidgetBridge?.requestOverlayPermission) {
    WidgetBridge.requestOverlayPermission();
  }
}

/** Update title and/or reset the hour calculation widget. Triggers widget refresh on Android. */
export function syncHourCalculationWidget(update: {
  title?: string;
  reset?: boolean;
}): void {
  const current = getHourCalculationState();
  const next: HourCalculationState = update.reset
    ? {
        title: update.title ?? current.title,
        isRunning: false,
        startTimeMs: 0,
        totalElapsedMs: 0,
      }
    : {
        ...current,
        ...(update.title !== undefined && { title: update.title }),
      };
  const json = JSON.stringify(next);
  setString(STORAGE_KEYS.HOUR_CALCULATION_WIDGET, json);
  const { WidgetBridge } = NativeModules;
  if (Platform.OS === 'ios') {
    if (WidgetBridge?.setHourCalculationState) {
      WidgetBridge.setHourCalculationState(json);
    }
  } else if (WidgetBridge?.updateWidgets) {
    WidgetBridge.updateWidgets();
  }
}
