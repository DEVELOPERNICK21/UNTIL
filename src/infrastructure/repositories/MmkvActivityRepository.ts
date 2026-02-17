/**
 * MmkvActivityRepository - MMKV-backed implementation of IActivityRepository
 * Widgets read from the same MMKV that this uses.
 */

import type { IActivityRepository } from '../../domain/repository/IActivityRepository';
import type { TimeBlock, ActivityCategory } from '../../types';
import { getString, setString, getNumber } from '../../persistence/mmkv';
import { STORAGE_KEYS, DEFAULTS } from '../../persistence/schema';
import { formatDateToIso } from '../../core/time/clock';
import { aggregateCategoryTotals } from '../../core/activity/aggregate';
import { nowMs } from '../../core/time/clock';
import { startOfYear, endOfDay } from '../../core/time/clock';
import { daysInYear } from '../../core/time/clock';

type Subscriber = () => void;

const CATEGORIES: ActivityCategory[] = ['work', 'sleep', 'social', 'gym', 'nothing'];

function blocksKey(dateIso: string): string {
  return `${STORAGE_KEYS.ACTIVITY_BLOCKS_PREFIX}${dateIso}`;
}

function emptyTotals(): Record<ActivityCategory, number> {
  return { work: 0, sleep: 0, social: 0, gym: 0, nothing: 0 };
}

export class MmkvActivityRepository implements IActivityRepository {
  private subscribers: Set<Subscriber> = new Set();

  getBlocksForDate(dateIso: string): TimeBlock[] {
    const raw = getString(blocksKey(dateIso));
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as TimeBlock[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveBlocksForDate(dateIso: string, blocks: TimeBlock[]): void {
    setString(blocksKey(dateIso), JSON.stringify(blocks));
    this.notifySubscribers();
  }

  getDailyLimitNothing(): number {
    return getNumber(STORAGE_KEYS.ACTIVITY_DAILY_LIMIT_NOTHING) ?? DEFAULTS.ACTIVITY_DAILY_LIMIT_NOTHING;
  }

  getCurrentCategory(dateIso: string): ActivityCategory | null {
    const blocks = this.getBlocksForDate(dateIso);
    const ongoing = blocks.find((b) => b.endMs === undefined);
    return ongoing ? ongoing.category : null;
  }

  getCategoryTotals(dateIso: string, year: number): import('../../domain/repository/IActivityRepository').CategoryTotalsResult {
    const now = nowMs();

    const todayBlocks = this.getBlocksForDate(dateIso);
    const todayTotals = aggregateCategoryTotals(todayBlocks, now);

    const yearTotals = emptyTotals();
    const start = startOfYear(new Date(year, 0, 1));
    const days = daysInYear(year);
    const todayIso = formatDateToIso(new Date());
    for (let d = 0; d < days; d++) {
      const dte = new Date(start);
      dte.setDate(dte.getDate() + d);
      const iso = formatDateToIso(dte);
      const blocks = this.getBlocksForDate(iso);
      const refTime = iso === todayIso ? now : endOfDay(dte).getTime();
      const agg = aggregateCategoryTotals(blocks, refTime);
      for (const c of CATEGORIES) {
        yearTotals[c] += agg[c];
      }
    }

    const wastedMinutesToday = Math.round(todayTotals.nothing * 60);
    const primaryWastedCategory: ActivityCategory | null =
      wastedMinutesToday > 0 ? 'nothing' : null;
    const currentCategory = this.getCurrentCategory(dateIso);

    return {
      today: todayTotals,
      year: yearTotals,
      wastedMinutesToday,
      primaryWastedCategory,
      currentCategory,
    };
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => cb());
  }
}
