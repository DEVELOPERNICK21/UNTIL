/**
 * WidgetSync - Computes and writes widget cache for native widgets
 * Writes to MMKV (app) and UserDefaults App Group (iOS widget extension)
 * SSOT: Time logic stays in core/time; this layer only formats and persists
 */

import { NativeModules, Platform } from 'react-native';
import { getDayProgress } from '../core/time/day';
import { getMonthProgress } from '../core/time/month';
import { getYearProgress } from '../core/time/year';
import { now } from '../core/time/clock';
import { STORAGE_KEYS } from '../persistence/schema';
import { setString } from '../persistence/mmkv';
import type { WidgetCache } from '../surfaces/widgets/dataContract';

function computeWidgetCache(): WidgetCache {
  const date = now();
  const day = getDayProgress(date);
  const month = getMonthProgress(date);
  const year = getYearProgress(date);

  const totalMinutesInDay = 24 * 60;
  const passedMinutes = Math.floor(day.progress * totalMinutesInDay);
  const remainingMinutes = totalMinutesInDay - passedMinutes;

  return {
    dayProgress: day.progress,
    dayPercentDone: Math.round(day.progress * 100),
    dayPercentLeft: Math.round((1 - day.progress) * 100),
    dayHoursPassed: Math.round((day.progress * 24 * 60 * 60 * 1000) / (60 * 60 * 1000) * 10) / 10,
    dayHoursLeft: Math.round(day.remainingMs / (60 * 60 * 1000) * 10) / 10,
    dayPassedMinutes: passedMinutes,
    dayRemainingMinutes: remainingMinutes,
    monthProgress: month.progress,
    monthIndex: date.getMonth() + 1,
    monthDaysPassed: month.dayOfMonth,
    monthDaysLeft: month.remainingDays,
    monthPercent: Math.round(month.progress * 100),
    yearProgress: year.progress,
    yearDaysPassed: year.dayOfYear,
    yearDaysLeft: year.remainingDays,
    yearPercent: Math.round(year.progress * 100),
    updatedAt: Date.now(),
  };
}

export function syncWidgetCache(): void {
  const cache = computeWidgetCache();
  const json = JSON.stringify(cache);
  setString(STORAGE_KEYS.WIDGET_CACHE, json);
  if (Platform.OS === 'ios') {
    const { WidgetBridge } = NativeModules;
    if (WidgetBridge?.setWidgetCache) {
      WidgetBridge.setWidgetCache(json);
    }
  }
}
