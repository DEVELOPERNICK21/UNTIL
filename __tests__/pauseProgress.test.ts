/**
 * The gentle game: calm minutes, levels, the week, milestones. The rules that keep it from ever making
 * anyone feel worse are tested as rules.
 */

import {
  DAILY_GOAL_SECONDS,
  EMPTY_PROGRESS,
  LEVELS,
  MILESTONE_IDS,
  MIN_COUNTED_SECONDS,
  calmMinutes,
  goalReached,
  levelFor,
  newMilestones,
  recordSession,
  sanitizeProgress,
  secondsToday,
  weekDays,
  type PauseProgress,
  type SessionRecord,
} from '../src/features/pause/domain/pauseProgress';

const session = (patch: Partial<SessionRecord> = {}): SessionRecord => ({
  practice: 'sigh',
  seconds: 60,
  date: '2026-11-23', // a Monday
  hour: 14,
  ...patch,
});

const record = (p: PauseProgress, ...sessions: Array<Partial<SessionRecord>>) =>
  sessions.reduce((acc, s) => recordSession(acc, session(s)), p);

describe('recordSession', () => {
  it('adds the seconds to the day, the total and the session count', () => {
    const p = record(EMPTY_PROGRESS, { seconds: 90 });
    expect(p.days['2026-11-23']).toBe(90);
    expect(p.totalSeconds).toBe(90);
    expect(p.sessions).toBe(1);
    expect(p.tried).toEqual(['sigh']);
  });

  it('adds up over the day and over days', () => {
    const p = record(EMPTY_PROGRESS, { seconds: 60 }, { seconds: 120 }, { seconds: 60, date: '2026-11-24' });
    expect(p.days).toEqual({ '2026-11-23': 180, '2026-11-24': 60 });
    expect(p.totalSeconds).toBe(240);
    expect(p.sessions).toBe(3);
  });

  it('does not change anything for a session too short to count', () => {
    expect(recordSession(EMPTY_PROGRESS, session({ seconds: MIN_COUNTED_SECONDS - 1 }))).toBe(EMPTY_PROGRESS);
    expect(recordSession(EMPTY_PROGRESS, session({ seconds: Number.NaN }))).toBe(EMPTY_PROGRESS);
    expect(recordSession(EMPTY_PROGRESS, session({ seconds: -5 }))).toBe(EMPTY_PROGRESS);
    expect(recordSession(EMPTY_PROGRESS, session({ seconds: MIN_COUNTED_SECONDS })).sessions).toBe(1);
  });

  it('never changes the progress it was given', () => {
    const before = record(EMPTY_PROGRESS, { seconds: 60 });
    const copy = JSON.stringify(before);
    record(before, { seconds: 60, practice: 'box' });
    expect(JSON.stringify(before)).toBe(copy);
  });

  it('remembers each practice once', () => {
    const p = record(EMPTY_PROGRESS, { practice: 'box' }, { practice: 'box' }, { practice: 'wind' });
    expect(p.tried).toEqual(['box', 'wind']);
  });

  it('keeps only the last 120 days', () => {
    let p = EMPTY_PROGRESS;
    for (let i = 0; i < 130; i += 1) {
      const d = new Date(2026, 0, 1 + i);
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      p = recordSession(p, session({ date }));
    }
    expect(Object.keys(p.days)).toHaveLength(120);
    expect(p.sessions).toBe(130);
    expect(p.totalSeconds).toBe(130 * 60);
  });
});

describe('levels', () => {
  it('start at settling and only go up with total calm', () => {
    expect(levelFor(0).id).toBe('settling');
    expect(levelFor(599).id).toBe('settling');
    expect(levelFor(600).id).toBe('steady');
    expect(levelFor(30 * 60).id).toBe('still');
    expect(levelFor(75 * 60).id).toBe('deep');
    expect(levelFor(150 * 60).id).toBe('tranquil');
    expect(levelFor(10 ** 7).id).toBe('tranquil');
  });

  it('never go down as the total grows', () => {
    let last = -1;
    for (let s = 0; s <= 200 * 60; s += 30) {
      const { index } = levelFor(s);
      expect(index).toBeGreaterThanOrEqual(last);
      last = index;
    }
  });

  it('report progress and time to the next level, and are full at the top', () => {
    const half = levelFor(300);
    expect(half.next).toBe('steady');
    expect(half.progress).toBeCloseTo(0.5, 5);
    expect(half.secondsToNext).toBe(300);
    const top = levelFor(150 * 60);
    expect(top.next).toBeNull();
    expect(top.progress).toBe(1);
    expect(top.secondsToNext).toBe(0);
  });

  it('are ordered and start at zero', () => {
    expect(LEVELS[0].minSeconds).toBe(0);
    LEVELS.slice(1).forEach((level, i) => expect(level.minSeconds).toBeGreaterThan(LEVELS[i].minSeconds));
  });

  it('treat negative totals as zero', () => {
    expect(levelFor(-50).id).toBe('settling');
  });
});

describe('the week', () => {
  it('shows the seven days of the current week, Monday first, and marks today', () => {
    const p = record(EMPTY_PROGRESS, { date: '2026-11-24', seconds: 60 });
    const week = weekDays(p, '2026-11-26'); // a Thursday
    expect(week.map(d => d.date)).toEqual([
      '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29',
    ]);
    expect(week.map(d => d.practised)).toEqual([false, true, false, false, false, false, false]);
    expect(week.filter(d => d.isToday).map(d => d.date)).toEqual(['2026-11-26']);
  });

  it('starts a Sunday\'s week on the Monday before it', () => {
    expect(weekDays(EMPTY_PROGRESS, '2026-11-29')[0].date).toBe('2026-11-23');
    expect(weekDays(EMPTY_PROGRESS, '2026-11-23')[0].date).toBe('2026-11-23');
  });

  it('crosses a month and a year without losing a day', () => {
    expect(weekDays(EMPTY_PROGRESS, '2026-12-31').map(d => d.date)).toEqual([
      '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03',
    ]);
  });

  it('is a view of what was done, never a count of days in a row: a missed day takes nothing away', () => {
    const p = record(EMPTY_PROGRESS, { date: '2026-11-23' }, { date: '2026-11-25' });
    const week = weekDays(p, '2026-11-26');
    expect(week.filter(d => d.practised).map(d => d.date)).toEqual(['2026-11-23', '2026-11-25']);
    expect(p.totalSeconds).toBe(120);
    expect(p).not.toHaveProperty('streak');
  });

  it('reads seconds for today', () => {
    const p = record(EMPTY_PROGRESS, { seconds: 100 });
    expect(secondsToday(p, '2026-11-23')).toBe(100);
    expect(secondsToday(p, '2026-11-24')).toBe(0);
    expect(DAILY_GOAL_SECONDS).toBe(180);
  });
});

describe('milestones', () => {
  it('"first" arrives with the first session', () => {
    expect(record(EMPTY_PROGRESS, {}).earned).toEqual(['first']);
  });

  it('"five" and "ten" count sessions', () => {
    const five = record(EMPTY_PROGRESS, ...Array.from({ length: 5 }, () => ({})));
    expect(five.earned).toEqual(expect.arrayContaining(['first', 'five']));
    expect(five.earned).not.toContain('ten');
    const ten = record(five, ...Array.from({ length: 5 }, () => ({})));
    expect(ten.earned).toContain('ten');
  });

  it('"explorer" needs all six practices', () => {
    const five = record(EMPTY_PROGRESS, ...(['sigh', 'coherent', 'box', 'extended', 'wind'] as const).map(practice => ({ practice })));
    expect(five.earned).not.toContain('explorer');
    expect(record(five, { practice: 'grounding' }).earned).toContain('explorer');
  });

  it('"week" arrives on the third day practised in one week', () => {
    const two = record(EMPTY_PROGRESS, { date: '2026-11-23' }, { date: '2026-11-24' });
    expect(two.earned).not.toContain('week');
    expect(record(two, { date: '2026-11-25' }).earned).toContain('week');
  });

  it('"week" does not count days spread over two weeks', () => {
    const p = record(EMPTY_PROGRESS, { date: '2026-11-22' }, { date: '2026-11-23' }, { date: '2026-11-24' });
    expect(p.earned).not.toContain('week');
  });

  it('"night" is for a session late at night or very early', () => {
    expect(record(EMPTY_PROGRESS, { hour: 21 }).earned).toContain('night');
    expect(record(EMPTY_PROGRESS, { hour: 2 }).earned).toContain('night');
    expect(record(EMPTY_PROGRESS, { hour: 14 }).earned).not.toContain('night');
    expect(record(EMPTY_PROGRESS, { hour: 5 }).earned).not.toContain('night');
  });

  it('once earned, always earned, even in another week', () => {
    const p = record(EMPTY_PROGRESS, { date: '2026-11-23' }, { date: '2026-11-24' }, { date: '2026-11-25' });
    const later = record(p, { date: '2026-12-20' });
    expect(later.earned).toContain('week');
  });

  it('keeps the earned list in the catalogue order, without duplicates', () => {
    const p = record(EMPTY_PROGRESS, ...Array.from({ length: 12 }, () => ({ hour: 22 })));
    expect(p.earned).toEqual(MILESTONE_IDS.filter(id => p.earned.includes(id)));
    expect(new Set(p.earned).size).toBe(p.earned.length);
  });

  it('reports only what a session newly earned', () => {
    const before = record(EMPTY_PROGRESS, {});
    const after = record(before, { hour: 23 });
    expect(newMilestones(before, after)).toEqual(['night']);
    expect(newMilestones(after, after)).toEqual([]);
  });
});

describe('sanitizeProgress', () => {
  it('turns anything unexpected into an empty start', () => {
    [null, undefined, 5, 'x', [], true].forEach(bad => {
      expect(sanitizeProgress(bad)).toEqual(EMPTY_PROGRESS);
    });
  });

  it('keeps good data and drops bad entries', () => {
    const p = sanitizeProgress({
      days: { '2026-11-23': 90, 'yesterday': 30, '2026-11-24': -5, '2026-11-25': 'x', '2026-11-26': 40.4 },
      totalSeconds: 130.2,
      sessions: 3,
      tried: ['sigh', 'sigh', 'bogus', 7],
      earned: ['first', 'bogus', 'night'],
    });
    expect(p.days).toEqual({ '2026-11-23': 90, '2026-11-26': 40 });
    expect(p.totalSeconds).toBe(130);
    expect(p.sessions).toBe(3);
    expect(p.tried).toEqual(['sigh']);
    expect(p.earned).toEqual(['first', 'night']);
  });

  it('stores nothing about how anyone felt or what they picked', () => {
    expect(Object.keys(EMPTY_PROGRESS).sort()).toEqual(['days', 'earned', 'sessions', 'totalSeconds', 'tried']);
  });
});

describe('calmMinutes', () => {
  it('rounds to the nearest minute but never shows 0 for time that was practised', () => {
    expect(calmMinutes(0)).toBe(0);
    expect(calmMinutes(-5)).toBe(0);
    expect(calmMinutes(Number.NaN)).toBe(0);
    expect(calmMinutes(20)).toBe(1);
    expect(calmMinutes(29)).toBe(1);
    expect(calmMinutes(60)).toBe(1);
    expect(calmMinutes(89)).toBe(1);
    expect(calmMinutes(90)).toBe(2);
    expect(calmMinutes(125)).toBe(2);
    expect(calmMinutes(300)).toBe(5);
  });
});

describe('goalReached', () => {
  it('is reached when the minutes shown reach the goal', () => {
    expect(goalReached(0)).toBe(false);
    expect(goalReached(149)).toBe(false);
    expect(goalReached(150)).toBe(true);
    expect(goalReached(180)).toBe(true);
    expect(goalReached(600)).toBe(true);
  });
});
