import { formatDateToIso, todayIso } from '../src/core/time/clock';

describe('todayIso / formatDateToIso (local calendar day)', () => {
  it('formats from local Y-M-D, not UTC', () => {
    // 00:30 local on Sep 10. In positive offsets (e.g. IST), UTC is still Sep 9.
    const earlyMorning = new Date(2026, 8, 10, 0, 30, 0);
    expect(formatDateToIso(earlyMorning)).toBe('2026-09-10');

    const offsetMinutes = -earlyMorning.getTimezoneOffset();
    const minutesIntoDay =
      earlyMorning.getHours() * 60 + earlyMorning.getMinutes();
    if (offsetMinutes > 0 && minutesIntoDay < offsetMinutes) {
      expect(earlyMorning.toISOString().slice(0, 10)).not.toBe(
        formatDateToIso(earlyMorning),
      );
    }
  });

  it('todayIso matches formatDateToIso(now)', () => {
    expect(todayIso()).toBe(formatDateToIso(new Date()));
  });
});
