import {
  daysBetween,
  getDaysLeft,
  getSignedDaysUntil,
  isValidDateKey,
  parseDateKey,
} from '../src/features/countdowns/domain/daysLeft';

/** Local noon on a given date, so "today" is unambiguous whatever the timezone. */
const day = (y: number, m: number, d: number) =>
  new Date(y, m - 1, d, 12, 0, 0);

describe('getSignedDaysUntil', () => {
  it('counts calendar days: future, today and past', () => {
    const today = day(2026, 10, 22);
    expect(getSignedDaysUntil('2026-10-25', today)).toBe(3);
    expect(getSignedDaysUntil('2026-10-23', today)).toBe(1);
    expect(getSignedDaysUntil('2026-10-22', today)).toBe(0);
    expect(getSignedDaysUntil('2026-10-21', today)).toBe(-1);
    expect(getSignedDaysUntil('2026-10-10', today)).toBe(-12);
  });

  it('does not depend on the time of day', () => {
    const justAfterMidnight = new Date(2026, 9, 22, 0, 0, 1);
    const lateNight = new Date(2026, 9, 22, 23, 59, 59);
    expect(getSignedDaysUntil('2026-10-25', justAfterMidnight)).toBe(3);
    expect(getSignedDaysUntil('2026-10-25', lateNight)).toBe(3);
  });

  it('counts across month ends, year ends and leap days', () => {
    expect(getSignedDaysUntil('2026-11-02', day(2026, 10, 30))).toBe(3);
    expect(getSignedDaysUntil('2027-01-02', day(2026, 12, 30))).toBe(3);
    expect(getSignedDaysUntil('2028-03-01', day(2028, 2, 27))).toBe(3); // 2028 is a leap year
    expect(getSignedDaysUntil('2027-03-01', day(2027, 2, 27))).toBe(2);
  });

  describe.each([
    [
      'America/New_York',
      '2026-11-03',
      day(2026, 10, 31),
      3,
      'clocks go back on 1 Nov',
    ],
    [
      'America/New_York',
      '2026-03-10',
      day(2026, 3, 7),
      3,
      'clocks go forward on 8 Mar',
    ],
    [
      'Europe/London',
      '2026-10-28',
      day(2026, 10, 24),
      4,
      'clocks go back on 25 Oct',
    ],
    [
      'Australia/Sydney',
      '2026-04-08',
      day(2026, 4, 3),
      5,
      'clocks go back on 5 Apr',
    ],
  ])('around a clock change (%s)', (zone, target, today, expected, note) => {
    const original = process.env.TZ;
    beforeAll(() => {
      process.env.TZ = zone;
    });
    afterAll(() => {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    });

    it(`${target} is ${expected} days away (${note})`, () => {
      // Rebuild "today" in this zone so it really is that local date.
      const t = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        12,
      );
      expect(getSignedDaysUntil(target, t)).toBe(expected);
    });
  });

  it('gives 0 for something that is not a real date instead of NaN', () => {
    const today = day(2026, 10, 22);
    for (const junk of [
      '',
      'abc',
      '2026-02-30',
      '2026-13-01',
      '2026-10-1',
      '22/10/2026',
    ]) {
      expect(getSignedDaysUntil(junk, today)).toBe(0);
    }
  });
});

describe('getDaysLeft', () => {
  it('never goes below zero', () => {
    expect(getDaysLeft('2026-10-10', day(2026, 10, 22))).toBe(0);
    expect(getDaysLeft('2026-10-25', day(2026, 10, 22))).toBe(3);
  });
});

describe('daysBetween', () => {
  it('counts whole days between two dates, including across a clock change', () => {
    expect(daysBetween('2026-10-22', '2026-10-25')).toBe(3);
    expect(daysBetween('2026-10-30', '2026-11-03')).toBe(4);
    expect(daysBetween('2026-10-25', '2026-10-22')).toBe(0);
    expect(daysBetween('bad', '2026-10-22')).toBe(0);
  });
});

describe('parseDateKey / isValidDateKey', () => {
  it('accepts only real calendar dates in YYYY-MM-DD form', () => {
    expect(parseDateKey('2026-02-28')).toEqual({ y: 2026, m: 2, d: 28 });
    expect(isValidDateKey('2028-02-29')).toBe(true);
    expect(isValidDateKey('2027-02-29')).toBe(false);
    expect(isValidDateKey('2026-04-31')).toBe(false);
    expect(isValidDateKey(null)).toBe(false);
    expect(isValidDateKey(20261022)).toBe(false);
  });
});
