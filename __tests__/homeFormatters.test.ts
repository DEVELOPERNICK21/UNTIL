import {
  extraDayPercentText,
  formatDayPassedLeftWithSeconds,
  formatLifePassedLeft,
  formatMonthPassedLeft,
  formatYearPassedLeft,
} from '../src/core/time/homeFormatters';

const NOW = new Date(2026, 2, 15, 8, 12, 4); // 15 Mar 2026, 08:12:04 local

describe('homeFormatters', () => {
  it('formats day passed / left with seconds', () => {
    const day = formatDayPassedLeftWithSeconds(NOW);
    expect(day.passedStr).toBe('8h 12m 4s');
    expect(day.leftStr).toBe('15h 47m 55s');
    expect(day.passedPct).toBe(34);
    expect(day.leftPct).toBe(66);
    expect(day.progress).toBeCloseTo(29524000 / 86399999, 10);
  });

  it('formats month from remaining days using the given date', () => {
    expect(formatMonthPassedLeft(16, NOW)).toEqual({
      passedDays: 15,
      leftDays: 16,
      passedPct: 48,
      leftPct: 52,
    });
  });

  it('formats year from remaining days using the given date', () => {
    expect(formatYearPassedLeft(291, NOW)).toEqual({
      passedDays: 74,
      leftDays: 291,
      passedPct: 20,
      leftPct: 80,
    });
  });

  it('formats life from progress, remaining days, and death age', () => {
    expect(formatLifePassedLeft(0.42, 15000, 80)).toEqual({
      passedDays: 14220,
      leftDays: 15000,
      passedPct: 42,
      leftPct: 58,
      totalLifeDays: 29220,
    });
  });

  it('shows 0–100 in the extra when signed in with a birth date', () => {
    expect(
      extraDayPercentText({ signedIn: true, hasBirthDate: true, now: NOW }),
    ).toBe('34%');
  });

  it('shows a dash in the extra when signed out', () => {
    expect(
      extraDayPercentText({ signedIn: false, hasBirthDate: true, now: NOW }),
    ).toBe('—');
  });

  it('shows a dash in the extra when there is no birth date', () => {
    expect(
      extraDayPercentText({ signedIn: true, hasBirthDate: false, now: NOW }),
    ).toBe('—');
  });
});
