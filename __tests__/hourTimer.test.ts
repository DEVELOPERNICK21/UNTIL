import {
  DEFAULT_HOUR_TIMER,
  elapsedMs,
  formatElapsed,
  normalizeTimerTitle,
  parseHourTimerState,
  resetTimer,
  toggleTimer,
  type HourTimerState,
} from '../src/features/widgets/domain/hourTimer';
import { MAX_TITLE_LENGTH } from '../src/config/inputLimits';

const NOW = 1_800_000_000_000;
const stopped = (over: Partial<HourTimerState> = {}): HourTimerState => ({
  ...DEFAULT_HOUR_TIMER,
  title: 'Office',
  ...over,
});
const running = (over: Partial<HourTimerState> = {}): HourTimerState =>
  stopped({ isRunning: true, startTimeMs: NOW - 90_000, ...over });

describe('elapsedMs', () => {
  it('is the banked time plus the current run', () => {
    expect(elapsedMs(stopped({ totalElapsedMs: 60_000 }), NOW)).toBe(60_000);
    expect(elapsedMs(running({ totalElapsedMs: 60_000 }), NOW)).toBe(150_000);
  });

  it('never goes negative when the phone clock was set back during a run', () => {
    expect(elapsedMs(running({ startTimeMs: NOW + 5 * 60_000 }), NOW)).toBe(0);
    expect(
      elapsedMs(
        running({ startTimeMs: NOW + 5 * 60_000, totalElapsedMs: 10_000 }),
        NOW,
      ),
    ).toBe(10_000);
  });
});

describe('toggleTimer', () => {
  it('starts from stopped, keeping what was banked', () => {
    const next = toggleTimer(stopped({ totalElapsedMs: 5_000 }), NOW);
    expect(next).toMatchObject({
      isRunning: true,
      startTimeMs: NOW,
      totalElapsedMs: 5_000,
      title: 'Office',
    });
  });

  it('stops a running timer and banks the run', () => {
    const next = toggleTimer(running({ totalElapsedMs: 10_000 }), NOW);
    expect(next).toMatchObject({
      isRunning: false,
      startTimeMs: 0,
      totalElapsedMs: 100_000,
    });
  });

  it('banks nothing negative when the clock moved back before stopping', () => {
    const next = toggleTimer(
      running({ startTimeMs: NOW + 60_000, totalElapsedMs: 10_000 }),
      NOW,
    );
    expect(next.totalElapsedMs).toBe(10_000);
  });

  it('start then stop then start keeps adding up', () => {
    let state = stopped();
    state = toggleTimer(state, NOW);
    state = toggleTimer(state, NOW + 30_000);
    state = toggleTimer(state, NOW + 100_000);
    state = toggleTimer(state, NOW + 145_000);
    expect(state.totalElapsedMs).toBe(75_000);
  });
});

describe('resetTimer', () => {
  it('goes back to zero and stopped from either state, keeping the title', () => {
    for (const from of [
      running({ totalElapsedMs: 9_000 }),
      stopped({ totalElapsedMs: 9_000 }),
    ]) {
      expect(resetTimer(from)).toEqual({
        title: 'Office',
        isRunning: false,
        startTimeMs: 0,
        totalElapsedMs: 0,
      });
    }
  });
});

describe('parseHourTimerState', () => {
  it('reads what the widgets write', () => {
    expect(
      parseHourTimerState({
        title: 'Gym',
        isRunning: true,
        startTimeMs: 123,
        totalElapsedMs: 456,
      }),
    ).toEqual({
      title: 'Gym',
      isRunning: true,
      startTimeMs: 123,
      totalElapsedMs: 456,
    });
  });

  it('treats junk as the stopped default', () => {
    for (const bad of [null, undefined, 'x', 7, []]) {
      expect(parseHourTimerState(bad)).toEqual(DEFAULT_HOUR_TIMER);
    }
  });

  it('does not count from 1970 when it says running but has no start time', () => {
    const parsed = parseHourTimerState({
      title: 'X',
      isRunning: true,
      startTimeMs: 0,
      totalElapsedMs: 5,
    });
    expect(parsed).toMatchObject({
      isRunning: false,
      startTimeMs: 0,
      totalElapsedMs: 5,
    });
  });

  it('drops negative and non-numeric times', () => {
    expect(
      parseHourTimerState({ totalElapsedMs: -5, startTimeMs: 'x' }),
    ).toMatchObject({
      totalElapsedMs: 0,
      startTimeMs: 0,
      isRunning: false,
    });
  });
});

describe('normalizeTimerTitle', () => {
  it('trims, limits the length and falls back to the default', () => {
    expect(normalizeTimerTitle('  Office hour  ')).toBe('Office hour');
    expect(normalizeTimerTitle('x'.repeat(200))).toHaveLength(MAX_TITLE_LENGTH);
    expect(normalizeTimerTitle('   ')).toBe('Hour timer');
    expect(normalizeTimerTitle(undefined)).toBe('Hour timer');
  });
});

describe('formatElapsed', () => {
  it('formats as h:mm:ss, past a day too', () => {
    expect(formatElapsed(0)).toBe('0:00:00');
    expect(formatElapsed(65_000)).toBe('0:01:05');
    expect(formatElapsed(3_661_000)).toBe('1:01:01');
    expect(formatElapsed(100 * 3_600_000)).toBe('100:00:00');
    expect(formatElapsed(-5)).toBe('0:00:00');
  });
});
