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
  /** Passed minutes in current day (0–1440). SSOT with dayRemainingMinutes: passed + remaining = 1440 */
  dayPassedMinutes: number;
  /** Remaining minutes in current day (0–1440) */
  dayRemainingMinutes: number;
  monthProgress: number;
  /** Current month 1–12 (Jan=1, Feb=2, …). Used for month dots so 2nd dot = February */
  monthIndex: number;
  monthDaysPassed: number;
  monthDaysLeft: number;
  monthPercent: number;
  yearProgress: number;
  yearDaysPassed: number;
  yearDaysLeft: number;
  yearPercent: number;
  updatedAt: number;
}
