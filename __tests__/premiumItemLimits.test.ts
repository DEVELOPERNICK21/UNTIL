/**
 * The first deadline and the first counter are free; Premium (paid or the preview) lifts the limit.
 * Nothing already saved is ever removed when Premium ends.
 */

import { FREE_ITEM_LIMIT, PREMIUM_ITEM_LIMIT, itemLimit } from '../src/config/featureLimits';
import { AddCountdownUseCase } from '../src/features/countdowns/domain/useCases/AddCountdownUseCase';
import { AddCustomCounterUseCase } from '../src/features/counters/domain/useCases/AddCustomCounterUseCase';
import { featuredCountdown, sortByUrgency } from '../src/features/countdowns/domain/featured';
import { CheckCountdownCompletionUseCase } from '../src/features/countdowns/domain/useCases/CheckCountdownCompletionUseCase';
import { buildYourNumbers } from '../src/features/premium/domain/yourNumbers';
import type { Countdown, CustomCounter } from '../src/shared/types';

describe('itemLimit', () => {
  it('is one for free and a real ceiling for Premium', () => {
    expect(itemLimit(false)).toBe(FREE_ITEM_LIMIT);
    expect(FREE_ITEM_LIMIT).toBe(1);
    expect(itemLimit(true)).toBe(PREMIUM_ITEM_LIMIT);
    expect(PREMIUM_ITEM_LIMIT).toBeGreaterThan(FREE_ITEM_LIMIT);
  });
});

describe('adding past the limit', () => {
  const signals = { clearCountdownCompletedFired: jest.fn() } as never;

  it('adds a deadline until the limit and then changes nothing', () => {
    const stored: Countdown[] = [];
    const repo = {
      getAll: () => stored,
      add: jest.fn((title: string, date: string) => {
        const c = { id: `id-${stored.length}`, title, date };
        stored.push(c);
        return c;
      }),
    } as never;
    const useCase = new AddCountdownUseCase(repo, signals);

    expect(useCase.execute('A', '2026-12-01', 1)).not.toBeNull();
    expect(useCase.execute('B', '2026-12-02', 1)).toBeNull();
    expect(stored).toHaveLength(1);
    expect(useCase.execute('B', '2026-12-02', 3)).not.toBeNull();
    expect(stored).toHaveLength(2);
  });

  it('still lets a lapsed Premium user keep, but not add to, a longer list', () => {
    const stored = [1, 2, 3].map(n => ({ id: `c${n}`, title: `T${n}`, count: 0 })) as CustomCounter[];
    const repo = { getAll: () => stored, add: jest.fn() } as never;
    const useCase = new AddCustomCounterUseCase(repo);
    expect(useCase.execute('Water', itemLimit(false))).toBeNull();
    expect(stored).toHaveLength(3);
  });
});

describe('which deadline comes first', () => {
  const today = new Date(2026, 9, 29, 12, 0, 0); // 29 Oct 2026
  const d = (id: string, date: string): Countdown => ({ id, title: id, date, createdAt: '2026-10-01' });

  it('puts the nearest upcoming one first, then the ones that passed, newest first', () => {
    const list = [
      d('later', '2026-12-25'),
      d('passed-long', '2026-09-01'),
      d('soon', '2026-11-02'),
      d('passed-recent', '2026-10-27'),
      d('today', '2026-10-29'),
    ];
    expect(sortByUrgency(list, today).map(c => c.id)).toEqual([
      'today',
      'soon',
      'later',
      'passed-recent',
      'passed-long',
    ]);
  });

  it('shows a deadline that is still to come in front of one that has passed', () => {
    const list = [d('passed', '2026-10-01'), d('upcoming', '2027-01-01')];
    expect(featuredCountdown(list, today)?.id).toBe('upcoming');
  });

  it('shows the most recent past deadline when nothing is left to come', () => {
    const list = [d('old', '2026-01-01'), d('recent', '2026-10-20')];
    expect(featuredCountdown(list, today)?.id).toBe('recent');
  });

  it('is null for no deadlines, and keeps the saved order for two on the same day', () => {
    expect(featuredCountdown([], today)).toBeNull();
    const same = [d('first', '2026-11-05'), d('second', '2026-11-05')];
    expect(sortByUrgency(same, today).map(c => c.id)).toEqual(['first', 'second']);
  });

  it('does not change the list it was given', () => {
    const list = [d('b', '2026-12-01'), d('a', '2026-11-01')];
    sortByUrgency(list, today);
    expect(list.map(c => c.id)).toEqual(['b', 'a']);
  });
});

describe('celebrating a deadline with several saved', () => {
  const key = (n: number) => {
    const t = new Date();
    t.setDate(t.getDate() + n);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  };

  it('looks at the nearest deadline, not whichever was saved first', () => {
    const list: Countdown[] = [
      { id: 'far', title: 'Far', date: key(30), createdAt: key(-10) },
      { id: 'due', title: 'Due', date: key(0), createdAt: key(-10) },
    ];
    const signals = {
      getCountdownCompletedFiredId: jest.fn(() => null),
      setCountdownCompletedFired: jest.fn(),
      scheduleSharePrompt: jest.fn(),
      scheduleReviewPrompt: jest.fn(),
    };
    const onCompleted = jest.fn();
    new CheckCountdownCompletionUseCase(
      { getAll: () => list } as never,
      signals as never,
      onCompleted,
    ).execute();
    expect(onCompleted).toHaveBeenCalledWith({ countdown_id: 'due', days_used: 10 });
  });
});

describe('buildYourNumbers', () => {
  const progress = { day: 0.634, month: 0.91, life: 0.314 };

  it('rounds the person’s real figures and marks which widgets Premium adds', () => {
    const rows = buildYourNumbers(progress, true, 'October');
    expect(rows.map(r => [r.id, r.label, r.percent, r.premium])).toEqual([
      ['day', 'Today', 63, false],
      ['month', 'October', 91, true],
      ['life', 'Your life', 31, true],
    ]);
  });

  it('does not invent a life figure before there is a birth date', () => {
    expect(buildYourNumbers(progress, false, 'October')[2].percent).toBeNull();
  });

  it('never shows a percentage that is not a sane number', () => {
    const rows = buildYourNumbers({ day: NaN, month: 7, life: -2 }, true, 'May');
    expect(rows[0].percent).toBeNull();
    expect(rows[1].percent).toBe(100);
    expect(rows[2].percent).toBe(0);
  });
});
