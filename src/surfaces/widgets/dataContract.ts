/**
 * Shared data contract for native widgets
 * SSOT: storage keys from persistence/schema; WidgetCache type from types
 *
 * Lock screen widgets: Same WidgetCache, same data flow. iOS uses accessory
 * families (.accessoryInline, .accessoryCircular, .accessoryRectangular).
 * Android uses widgetCategory keyguard for lock screen placement.
 */

export { STORAGE_KEYS, DEFAULTS } from '../../persistence/schema';
export type { WidgetCache } from '../../types';

import type { ActivityCategory } from '../../types';

export interface WidgetData {
  birthDate: string | null;
  deathAge: number;
  dayProgress: number;
  monthProgress: number;
  yearProgress: number;
  lifeProgress: number;
  categoryTotals?: Partial<Record<ActivityCategory, number>>;
}
