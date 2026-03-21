/**
 * Premium widget types — SSOT for free vs premium vs V2 (coming soon)
 * Free: day, year (dashboard core)
 * Premium: month, life (widgets + Live Activity / overlay where applicable)
 * V2: counter, deadline (countdown), dailyTasks, hourCalc — surfaced as "Coming soon", not purchasable
 */

export type WidgetKind =
  | 'day'
  | 'month'
  | 'year'
  | 'counter'
  | 'countdown'
  | 'dailyTasks'
  | 'hourCalc' // matches LiveActivityWidgetType
  | 'life';

export const FREE_WIDGET_KINDS: WidgetKind[] = ['day', 'year'];

export const PREMIUM_WIDGET_KINDS: WidgetKind[] = ['month', 'life'];

/** V2 — visible as coming soon only; do not treat as premium unlock. */
export const V2_WIDGET_KINDS: WidgetKind[] = [
  'counter',
  'countdown',
  'dailyTasks',
  'hourCalc',
];

export function isV2Widget(kind: WidgetKind): boolean {
  return V2_WIDGET_KINDS.includes(kind);
}

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

export const FREE_LIVE_ACTIVITY_TYPES: LiveActivityWidgetType[] = [
  'day',
  'year',
];

export const PREMIUM_LIVE_ACTIVITY_TYPES: LiveActivityWidgetType[] = [
  'month',
  'life',
];

export const V2_LIVE_ACTIVITY_TYPES: LiveActivityWidgetType[] = [
  'dailyTasks',
  'hourCalc',
];

export function isV2LiveActivityType(type: LiveActivityWidgetType): boolean {
  return V2_LIVE_ACTIVITY_TYPES.includes(type);
}

export function isPremiumLiveActivityType(
  type: LiveActivityWidgetType,
): boolean {
  return PREMIUM_LIVE_ACTIVITY_TYPES.includes(type);
}
