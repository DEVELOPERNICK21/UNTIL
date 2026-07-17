import {
  dayAppealMood,
  dayAppealLine,
  dayAppealPalette,
  formatDayLeftoverLabel,
  presenceStreakDots,
} from '../src/core/widget/dayWidgetAppeal';

describe('dayWidgetAppeal', () => {
  it('maps progress bands to calm / mid / urgent', () => {
    expect(dayAppealMood(0.1)).toBe('calm');
    expect(dayAppealMood(0.5)).toBe('mid');
    expect(dayAppealMood(0.9)).toBe('urgent');
  });

  it('uses approved copy', () => {
    expect(dayAppealLine('calm')).toBe('Day still open');
    expect(dayAppealLine('mid')).toBe('Make the hours count');
    expect(dayAppealLine('urgent')).toBe('This day will never repeat.');
  });

  it('formats leftover minutes', () => {
    expect(formatDayLeftoverLabel(6 * 60 + 12)).toBe('6h 12m');
    expect(formatDayLeftoverLabel(45)).toBe('45m');
  });

  it('fills last N streak days ending today when noticed', () => {
    const dots = presenceStreakDots({
      count: 4,
      lastDateKey: '2026-07-17',
      todayKey: '2026-07-17',
      noticedToday: true,
    });
    expect(dots).toEqual([false, false, false, true, true, true, true]);
  });
});
