import {
  dateOverline,
  dayDots,
  fitCell,
  lifeDots,
  monthCells,
  monthLeadingBlanks,
  monthOverline,
  yearDots,
} from '../desktop/src/widgetData';

describe('dayDots', () => {
  it('lights one dot per hour and marks the current hour', () => {
    const { states, passed } = dayDots(0.5);
    expect(states).toHaveLength(24);
    expect(passed).toBe(12);
    expect(states.slice(0, 12).every(s => s === 'passed')).toBe(true);
    expect(states[12]).toBe('current');
    expect(states.slice(13).every(s => s === 'left')).toBe(true);
  });

  it('marks the first hour as current at midnight', () => {
    expect(dayDots(0).states[0]).toBe('current');
  });

  it('has no current dot once the day is over', () => {
    const { states } = dayDots(1);
    expect(states.every(s => s === 'passed')).toBe(true);
  });

  it('clamps nonsense', () => {
    expect(dayDots(-3).passed).toBe(0);
    expect(dayDots(9).passed).toBe(24);
  });
});

describe('monthCells', () => {
  it('lines the 1st up under its weekday with blanks first', () => {
    // 1 Oct 2026 is a Thursday: four blanks when the week starts on Sunday, three on Monday.
    const oct = new Date(2026, 9, 15);
    expect(monthLeadingBlanks(oct, 0)).toBe(4);
    expect(monthLeadingBlanks(oct, 1)).toBe(3);
  });

  it('marks days before today passed, today current, and the rest left', () => {
    const cells = monthCells(31, 15, 4);
    expect(cells.filter(c => c === 'blank')).toHaveLength(4);
    expect(cells.filter(c => c === 'passed')).toHaveLength(14);
    expect(cells.filter(c => c === 'current')).toHaveLength(1);
    expect(cells.filter(c => c === 'left')).toHaveLength(16);
  });

  it('never runs past the month', () => {
    const cells = monthCells(30, 99, 0);
    expect(cells.filter(c => c === 'current')).toHaveLength(1);
    expect(cells.filter(c => c === 'left')).toHaveLength(0);
  });
});

describe('yearDots', () => {
  it('gives every day a dot and today the accent', () => {
    const dots = yearDots(100);
    expect(dots).toHaveLength(365);
    expect(dots.filter(d => d === 'passed')).toHaveLength(99);
    expect(dots[99]).toBe('current');
    expect(dots.filter(d => d === 'left')).toHaveLength(265);
  });

  it('matches the phone: the gray dots equal the days left', () => {
    const passedIncludingToday = 288;
    const left = yearDots(passedIncludingToday).filter(d => d === 'left').length;
    expect(left).toBe(365 - passedIncludingToday);
  });
});

describe('lifeDots', () => {
  const life = { passedDays: 10_000, leftDays: 19_220, totalLifeDays: 29_220 };

  it('has one dot per year of the plan', () => {
    const dots = lifeDots(life, 80);
    expect(dots.states).toHaveLength(80);
    expect(dots.plan).toBe(80);
    expect(dots.states.filter(s => s === 'passed')).toHaveLength(Math.floor(80 * (10_000 / 29_220)));
  });

  it('says the years left with one decimal', () => {
    expect(lifeDots(life, 80).leftYears).toBe('52.6');
  });

  it('caps the dots at 120', () => {
    const long = { passedDays: 1, leftDays: 100_000, totalLifeDays: 100_001 };
    expect(lifeDots(long, 270).states).toHaveLength(120);
  });
});

describe('fitCell', () => {
  it('picks the cell that fits the narrower side', () => {
    expect(fitCell(31, 7, 140, 200, 5)).toBeCloseTo((140 - 30) / 7, 0);
    expect(fitCell(365, 20, 400, 40, 3)).toBeLessThan(5);
  });
});

describe('overlines', () => {
  it('names the date and month', () => {
    const d = new Date(2026, 9, 15);
    expect(dateOverline(d, 'en-US')).toBe('Thu, Oct 15');
    expect(monthOverline(d, 'en-US')).toBe('October 2026');
  });
});
