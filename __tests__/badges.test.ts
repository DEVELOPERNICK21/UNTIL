import {
  BADGES,
  EMPTY_BADGE_SNAPSHOT,
  PERFECT_DAY_MIN_TASKS,
  countCompletedTasks,
  countPerfectDays,
  findNewlyEarned,
  getBadgeDefinition,
  getBadgeProgress,
  pickUpNext,
  type BadgeSnapshot,
} from '../src/domain/badges/badgeCatalog';
import { buildDailyQuests } from '../src/domain/badges/dailyQuests';

function snap(patch: Partial<BadgeSnapshot>): BadgeSnapshot {
  return { ...EMPTY_BADGE_SNAPSHOT, ...patch };
}

describe('badge catalog', () => {
  it('has unique ids and positive targets', () => {
    const ids = BADGES.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of BADGES) {
      expect(b.target).toBeGreaterThan(0);
      expect(b.title.length).toBeGreaterThan(0);
    }
  });

  it('keeps user-facing copy free of em dashes', () => {
    for (const b of BADGES) {
      expect(`${b.title} ${b.description}`).not.toContain('—');
    }
  });

  it('earns nothing from an empty snapshot', () => {
    expect(findNewlyEarned(EMPTY_BADGE_SNAPSHOT, new Set())).toEqual([]);
  });

  it('earns every badge on a metric once its target is reached', () => {
    expect(findNewlyEarned(snap({ longestStreak: 3 }), new Set())).toEqual([
      'streak_1',
      'streak_3',
    ]);
    expect(findNewlyEarned(snap({ tasksCompleted: 10 }), new Set())).toEqual([
      'task_1',
      'task_10',
    ]);
  });

  it('does not report a badge twice', () => {
    const earned = new Set(['streak_1', 'streak_3']);
    expect(findNewlyEarned(snap({ longestStreak: 7 }), earned)).toEqual([
      'streak_7',
    ]);
  });

  it('uses longest streak so a reset never hides progress', () => {
    const badge = getBadgeDefinition('streak_7');
    expect(badge).toBeDefined();
    expect(getBadgeProgress(badge!, snap({ longestStreak: 9 })).reached).toBe(
      true,
    );
  });

  it('clamps progress between 0 and 1', () => {
    const badge = getBadgeDefinition('task_10')!;
    expect(getBadgeProgress(badge, snap({ tasksCompleted: 4 })).ratio).toBe(0.4);
    expect(getBadgeProgress(badge, snap({ tasksCompleted: 99 })).ratio).toBe(1);
    expect(getBadgeProgress(badge, snap({ tasksCompleted: -5 })).ratio).toBe(0);
  });

  it('picks the closest unfinished badge as up next', () => {
    const next = pickUpNext(
      snap({ longestStreak: 6, tasksCompleted: 2 }),
      new Set(['streak_1', 'streak_3', 'task_1']),
    );
    expect(next?.id).toBe('streak_7');
  });

  it('has no up next hint when nothing has started', () => {
    expect(pickUpNext(EMPTY_BADGE_SNAPSHOT, new Set())).toBeNull();
  });
});

describe('task counters', () => {
  const task = (date: string, completed: boolean) => ({ date, completed });

  it('counts completed tasks across days', () => {
    expect(
      countCompletedTasks([
        task('2026-10-01', true),
        task('2026-10-01', false),
        task('2026-10-02', true),
      ]),
    ).toBe(2);
  });

  it('counts a clean day only with enough tasks, all done', () => {
    const tasks = [
      // Clean: 3 of 3.
      task('2026-10-01', true),
      task('2026-10-01', true),
      task('2026-10-01', true),
      // One left undone.
      task('2026-10-02', true),
      task('2026-10-02', true),
      task('2026-10-02', false),
      // Too few tasks to count.
      task('2026-10-03', true),
    ];
    expect(PERFECT_DAY_MIN_TASKS).toBe(3);
    expect(countPerfectDays(tasks)).toBe(1);
  });

  it('drops a clean day when a task is un-checked', () => {
    const day = ['a', 'b', 'c'].map(() => task('2026-10-01', true));
    expect(countPerfectDays(day)).toBe(1);
    day[0] = task('2026-10-01', false);
    expect(countPerfectDays(day)).toBe(0);
  });
});

describe('daily quests', () => {
  it('starts at one of three once the app is open', () => {
    const q = buildDailyQuests({
      noticedToday: true,
      tasksTotal: 0,
      tasksCompleted: 0,
    });
    expect(q.doneCount).toBe(1);
    expect(q.ratio).toBeCloseTo(1 / 3);
    expect(q.allDone).toBe(false);
  });

  it('moves the ring with each finished task', () => {
    const q = buildDailyQuests({
      noticedToday: true,
      tasksTotal: 4,
      tasksCompleted: 2,
    });
    expect(q.quests[2].detail).toBe('2/4');
    expect(q.ratio).toBeCloseTo((1 + 1 + 0.5) / 3);
    expect(q.allDone).toBe(false);
  });

  it('is complete when every task is done', () => {
    const q = buildDailyQuests({
      noticedToday: true,
      tasksTotal: 3,
      tasksCompleted: 3,
    });
    expect(q.allDone).toBe(true);
    expect(q.ratio).toBe(1);
  });

  it('does not count an empty day as finished', () => {
    const q = buildDailyQuests({
      noticedToday: true,
      tasksTotal: 0,
      tasksCompleted: 0,
    });
    expect(q.quests[2].done).toBe(false);
    expect(q.quests[1].detail).toBe('Add a task');
  });

  it('ignores impossible input', () => {
    const q = buildDailyQuests({
      noticedToday: false,
      tasksTotal: 2,
      tasksCompleted: 9,
    });
    expect(q.quests[2].ratio).toBe(1);
    expect(q.ratio).toBeLessThanOrEqual(1);
  });
});
