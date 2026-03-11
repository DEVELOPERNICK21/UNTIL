/**
 * Premium widget types — SSOT for free vs premium
 * Free: day, year, counter
 * Premium: month, countdown, dailyTasks, hourCalc, life
 */

export type WidgetKind =
  | 'day'
  | 'month'
  | 'year'
  | 'counter'
  | 'countdown'
  | 'dailyTasks'
  | 'hourCalc'  // matches LiveActivityWidgetType
  | 'life';

export const FREE_WIDGET_KINDS: WidgetKind[] = ['day', 'year', 'counter'];

export const PREMIUM_WIDGET_KINDS: WidgetKind[] = [
  'month',
  'countdown',
  'dailyTasks',
  'hourCalc',
  'life',
];

export function isPremiumWidget(kind: WidgetKind): boolean {
  return PREMIUM_WIDGET_KINDS.includes(kind);
}

/** Live Activity / Dynamic Island / Overlay widget types */
export type LiveActivityWidgetType =
  | 'day'
  | 'month'
  | 'year'
  | 'life'
  | 'dailyTasks'
  | 'hourCalc';

export const FREE_LIVE_ACTIVITY_TYPES: LiveActivityWidgetType[] = ['day', 'year'];

export const PREMIUM_LIVE_ACTIVITY_TYPES: LiveActivityWidgetType[] = [
  'month',
  'life',
  'dailyTasks',
  'hourCalc',
];

export function isPremiumLiveActivityType(type: LiveActivityWidgetType): boolean {
  return PREMIUM_LIVE_ACTIVITY_TYPES.includes(type);
}
