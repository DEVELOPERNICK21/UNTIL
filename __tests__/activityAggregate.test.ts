import {
  aggregateCategoryTotals,
  capNothingHoursForToday,
  hoursElapsedInDay,
} from '../src/core/activity/aggregate';
import type { TimeBlock } from '../src/types';

describe('activity aggregate', () => {
  const afternoon = new Date(2026, 6, 17, 15, 25, 0).getTime();

  it('merges overlapping nothing blocks instead of double-counting', () => {
    const blocks: TimeBlock[] = [
      { startMs: afternoon - 60 * 60 * 1000, endMs: afternoon, category: 'nothing' },
      { startMs: afternoon - 60 * 60 * 1000, endMs: afternoon, category: 'nothing' },
      { startMs: afternoon - 30 * 60 * 1000, endMs: afternoon, category: 'nothing' },
    ];

    const totals = aggregateCategoryTotals(blocks, afternoon);
    expect(totals.nothing).toBeCloseTo(1, 5);
  });

  it('caps nothing hours at time elapsed today', () => {
    const dayStart = new Date(2026, 6, 17, 0, 0, 0).getTime();
    const blocks: TimeBlock[] = [
      {
        startMs: dayStart,
        endMs: dayStart + 30 * 60 * 60 * 1000,
        category: 'nothing',
      },
    ];

    const totals = aggregateCategoryTotals(blocks, afternoon);
    expect(hoursElapsedInDay(afternoon)).toBeCloseTo(15.42, 1);
    expect(totals.nothing).toBeLessThanOrEqual(hoursElapsedInDay(afternoon));
    expect(totals.nothing).toBeLessThanOrEqual(24);
  });

  it('never reports more than 24h of lost time', () => {
    expect(capNothingHoursForToday(41.5, afternoon)).toBeLessThanOrEqual(24);
    expect(capNothingHoursForToday(41.5, afternoon)).toBe(
      hoursElapsedInDay(afternoon)
    );
  });
});
