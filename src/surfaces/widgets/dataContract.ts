/**
 * Shared data contract for native widgets
 * SSOT: storage keys live in persistence/schema (native widgets read the same
 * MMKV keys); WidgetCache type from types
 *
 * Lock screen widgets: Same WidgetCache, same data flow. iOS uses accessory
 * families (.accessoryInline, .accessoryCircular, .accessoryRectangular).
 * Android uses widgetCategory keyguard for lock screen placement.
 */

export type { WidgetCache } from '../../types';
export type { WidgetData } from '../../types/widgetDataContract';
