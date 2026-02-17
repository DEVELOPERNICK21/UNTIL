/**
 * Shared data contract for native widgets
 * Use same keys as persistence/schema.ts in Swift/Kotlin widget code
 */

export { STORAGE_KEYS, DEFAULTS } from '../../persistence/schema';

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

export interface WidgetCache {
  dayProgress: number;
  dayPercentDone: number;
  dayPercentLeft: number;
  dayHoursPassed: number;
  dayHoursLeft: number;
  monthProgress: number;
  monthDaysPassed: number;
  monthDaysLeft: number;
  monthPercent: number;
  yearProgress: number;
  yearDaysPassed: number;
  yearDaysLeft: number;
  yearPercent: number;
  updatedAt: number;
}
