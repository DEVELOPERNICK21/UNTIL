/**
 * Shared data contract for native widgets
 * SSOT: storage keys from persistence/schema; WidgetCache type from types
 *
 * Lock screen widgets: Same WidgetCache, same data flow. iOS uses accessory
 * families (.accessoryInline, .accessoryCircular, .accessoryRectangular).
 * Android uses widgetCategory keyguard for lock screen placement.
 */

export { STORAGE_KEYS, DEFAULTS } from '../../types/widgetDataContract';
export type { WidgetCache } from '../../types';
export type { WidgetData } from '../../types/widgetDataContract';
