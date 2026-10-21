import {
  orderHomeCards,
  partOfDay,
  scrollDepthBucket,
  MAX_VISIBLE_HOME_CARDS,
} from '../src/features/home/domain/homeCardOrder';

const base = { nextCountdownDays: null, coachAvailable: true };

describe('partOfDay', () => {
  it('splits the day', () => {
    expect(partOfDay(5)).toBe('morning');
    expect(partOfDay(11)).toBe('morning');
    expect(partOfDay(12)).toBe('afternoon');
    expect(partOfDay(17)).toBe('afternoon');
    expect(partOfDay(18)).toBe('evening');
    expect(partOfDay(2)).toBe('evening');
  });
});

describe('orderHomeCards', () => {
  it('shows tasks, then the coach, then countdowns in the morning', () => {
    const { visible, more } = orderHomeCards({ ...base, hour: 8 });
    expect(visible).toEqual(['quests', 'coach', 'countdown']);
    expect(more).toEqual(['lostTime', 'badges']);
  });

  it('shows tasks, countdowns, then the coach in the afternoon', () => {
    expect(orderHomeCards({ ...base, hour: 14 }).visible).toEqual(['quests', 'countdown', 'coach']);
  });

  it('puts the coach first in the evening', () => {
    expect(orderHomeCards({ ...base, hour: 21 }).visible).toEqual(['coach', 'quests', 'countdown']);
  });

  it('moves a countdown that is close to the top at any hour', () => {
    for (const hour of [8, 14, 21]) {
      expect(orderHomeCards({ ...base, hour, nextCountdownDays: 2 }).visible[0]).toBe('countdown');
    }
    expect(orderHomeCards({ ...base, hour: 21, nextCountdownDays: 0 }).visible[0]).toBe('countdown');
  });

  it('leaves a far or missing countdown where it is', () => {
    expect(orderHomeCards({ ...base, hour: 8, nextCountdownDays: 30 }).visible[0]).toBe('quests');
    expect(orderHomeCards({ ...base, hour: 8, nextCountdownDays: -2 }).visible[0]).toBe('quests');
    expect(orderHomeCards({ ...base, hour: 8 }).visible[0]).toBe('quests');
  });

  it('drops the coach when it has nothing to say, and pulls the next card up', () => {
    const { visible, more } = orderHomeCards({ ...base, hour: 8, coachAvailable: false });
    expect(visible).toEqual(['quests', 'countdown', 'lostTime']);
    expect(more).toEqual(['badges']);
  });

  it('never shows more than the limit, and loses no card', () => {
    for (const hour of [3, 8, 14, 21]) {
      for (const nextCountdownDays of [null, 1, 40]) {
        const { visible, more } = orderHomeCards({ ...base, hour, nextCountdownDays });
        expect(visible.length).toBeLessThanOrEqual(MAX_VISIBLE_HOME_CARDS);
        expect([...visible, ...more].sort()).toEqual(
          ['badges', 'coach', 'countdown', 'lostTime', 'quests'].sort(),
        );
      }
    }
  });
});

describe('scrollDepthBucket', () => {
  it('buckets how far down the page someone got', () => {
    expect(scrollDepthBucket(0, 800, 2000)).toBe(0);
    expect(scrollDepthBucket(200, 800, 2000)).toBe(0);
    expect(scrollDepthBucket(300, 800, 2000)).toBe(25);
    expect(scrollDepthBucket(600, 800, 2000)).toBe(50);
    expect(scrollDepthBucket(900, 800, 2000)).toBe(75);
    expect(scrollDepthBucket(1200, 800, 2000)).toBe(100);
    expect(scrollDepthBucket(5000, 800, 2000)).toBe(100);
  });

  it('is zero when nothing scrolls', () => {
    expect(scrollDepthBucket(0, 800, 700)).toBe(0);
    expect(scrollDepthBucket(50, 800, 800)).toBe(0);
  });
});
