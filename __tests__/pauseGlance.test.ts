import { buildPauseGlance } from '../src/features/pause/domain/pauseGlance';
import { DAILY_GOAL_SECONDS, EMPTY_PROGRESS, type PauseProgress } from '../src/features/pause/domain/pauseProgress';

const progress = (days: Record<string, number>, totalSeconds = 0): PauseProgress => ({
  ...EMPTY_PROGRESS,
  days,
  totalSeconds,
});

describe('buildPauseGlance', () => {
  it('carries counts only: seconds by date, the goal and the level', () => {
    const glance = buildPauseGlance(progress({ '2026-11-23': 125, '2026-11-22': 60 }, 185), '2026-11-23');
    expect(glance).toEqual({
      recent: { '2026-11-23': 125, '2026-11-22': 60 },
      goalSeconds: DAILY_GOAL_SECONDS,
      level: 'settling',
    });
    expect(Object.keys(glance).sort()).toEqual(['goalSeconds', 'level', 'recent']);
  });

  it('keeps only the last two weeks, so the payload stays small', () => {
    const glance = buildPauseGlance(
      progress({ '2026-11-23': 60, '2026-11-10': 60, '2026-11-09': 60, '2026-10-01': 60 }),
      '2026-11-23',
    );
    // 14 days back from the 23rd is the 10th (inclusive).
    expect(Object.keys(glance.recent).sort()).toEqual(['2026-11-10', '2026-11-23']);
  });

  it('leaves out days with nothing practised', () => {
    const glance = buildPauseGlance(progress({ '2026-11-23': 0, '2026-11-22': 90 }), '2026-11-23');
    expect(glance.recent).toEqual({ '2026-11-22': 90 });
  });

  it('works across a month and year boundary', () => {
    const glance = buildPauseGlance(progress({ '2026-12-31': 60, '2027-01-01': 60 }), '2027-01-03');
    expect(glance.recent).toEqual({ '2026-12-31': 60, '2027-01-01': 60 });
  });

  it('reports the level from total calm time, which only goes up', () => {
    expect(buildPauseGlance(progress({}, 10 * 60), '2026-11-23').level).toBe('steady');
    expect(buildPauseGlance(progress({}, 150 * 60), '2026-11-23').level).toBe('tranquil');
  });

  it('is empty, not broken, for someone who has never practised', () => {
    expect(buildPauseGlance(EMPTY_PROGRESS, '2026-11-23')).toEqual({
      recent: {},
      goalSeconds: DAILY_GOAL_SECONDS,
      level: 'settling',
    });
  });
});
