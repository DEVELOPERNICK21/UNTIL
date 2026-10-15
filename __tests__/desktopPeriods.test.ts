import { buildPanelModel } from '../src/core/time/panelModel';
import { buildPeriods, dayChip, dayParts } from '../desktop/src/periods';

const NOON = new Date(2026, 9, 15, 12, 0, 0);
const profile = { signedIn: true, birthDate: '1990-05-01', deathAge: 80 };

describe('dayParts', () => {
  it('splits a countdown into hours, minutes and seconds', () => {
    expect(dayParts('9h 32m 53s')).toEqual([
      { value: '9', unit: 'h' },
      { value: '32', unit: 'm' },
      { value: '53', unit: 's' },
    ]);
  });

  it('shows text it does not understand as it is', () => {
    expect(dayParts('soon')).toEqual([{ value: 'soon', unit: '' }]);
  });
});

describe('dayChip', () => {
  it('drops the seconds so the chip does not flicker', () => {
    expect(dayChip('9h 32m 53s')).toBe('9h 32m');
  });

  it('drops an empty hour and keeps the minutes', () => {
    expect(dayChip('0h 14m 2s')).toBe('14m');
  });
});

describe('buildPeriods', () => {
  const periods = buildPeriods(buildPanelModel(profile, NOON), { signedIn: true });

  it('has all four periods in order', () => {
    expect(Object.keys(periods)).toEqual(['day', 'month', 'year', 'life']);
  });

  it('reads the day as half gone at noon, with a mark for each hour', () => {
    expect(periods.day.progress).toBeCloseTo(0.5, 2);
    expect(periods.day.passedPct).toBe(50);
    expect(periods.day.ticks).toEqual({ count: 24, passed: 12 });
    expect(periods.day.left.caption).toBe('left today');
    expect(periods.day.passed.caption).toBe('passed today');
  });

  it('puts the days of the month on the dial', () => {
    const month = periods.month;
    expect(month.ticks?.count).toBe(31);
    expect(month.ticks?.passed).toBe(15);
    expect(month.left.parts[0].unit).toBe('days');
    expect(month.chip).toMatch(/^\d+d$/);
  });

  it('puts twelve months on the year dial', () => {
    expect(periods.year.ticks?.count).toBe(12);
    expect(periods.year.ticks?.passed).toBe(9);
  });

  it('puts the decades of a life on the dial', () => {
    expect(periods.life.locked).toBe(false);
    expect(periods.life.ticks?.count).toBe(8);
    expect(periods.life.progress).toBeGreaterThan(0.3);
    expect(periods.life.chip).toMatch(/d$/);
  });

  it('locks life until there is a birth date, and says why', () => {
    const noBirth = buildPeriods(
      buildPanelModel({ ...profile, birthDate: null }, NOON),
      { signedIn: true },
    );
    expect(noBirth.life.locked).toBe(true);
    expect(noBirth.life.progress).toBeNull();
    expect(noBirth.life.ticks).toBeNull();
    expect(noBirth.life.left.caption).toBe('Needs your birth date');

    const signedOut = buildPeriods(
      buildPanelModel({ signedIn: false, birthDate: null, deathAge: null }, NOON),
      { signedIn: false },
    );
    expect(signedOut.life.left.caption).toBe('To see your life');
  });

  it('never uses a dash in the words it shows', () => {
    const all = Object.values(periods).flatMap(p => [
      p.label,
      p.chip,
      p.left.caption,
      p.passed.caption,
    ]);
    all.forEach(text => expect(text).not.toMatch(/[—–]/));
  });
});
