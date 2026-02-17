/**
 * IActivityRepository - Port for activity/time block data
 * Single Source of Truth: all reads/writes for activity blocks go through this interface.
 */

import type { TimeBlock, ActivityCategory } from '../../types';

type Subscriber = () => void;

export interface CategoryTotalsResult {
  today: Record<ActivityCategory, number>;
  year: Record<ActivityCategory, number>;
  wastedMinutesToday: number;
  primaryWastedCategory: ActivityCategory | null;
  currentCategory: ActivityCategory | null;
}

export interface IActivityRepository {
  getBlocksForDate(dateIso: string): TimeBlock[];
  saveBlocksForDate(dateIso: string, blocks: TimeBlock[]): void;
  getCategoryTotals(dateIso: string, year: number): CategoryTotalsResult;
  getCurrentCategory(dateIso: string): ActivityCategory | null;
  getDailyLimitNothing(): number;
  subscribe(callback: Subscriber): () => void;
}
