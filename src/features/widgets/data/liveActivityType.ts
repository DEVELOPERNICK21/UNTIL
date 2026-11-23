/**
 * Which view the Dynamic Island (iOS) and the floating overlay (Android) show. Kept apart from
 * WidgetSync so adding a view does not grow that file.
 */

import { STORAGE_KEYS } from '../../../shared/persistence/schema';
import { getString, setString } from '../../../shared/persistence/mmkv';

export type LiveActivityWidgetType =
  | 'day'
  | 'month'
  | 'year'
  | 'life'
  | 'dailyTasks'
  | 'hourCalc'
  | 'calm';

export const LIVE_ACTIVITY_WIDGET_TYPES: LiveActivityWidgetType[] = [
  'day',
  'month',
  'year',
  'life',
  'dailyTasks',
  'hourCalc',
  'calm',
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
