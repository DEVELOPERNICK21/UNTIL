/**
 * The breathing rhythm of Pause: where in the breath we are, and when a round is over.
 */

import {
  BREATH_PACES,
  ROUND_MS,
  breathAt,
  breathLengthMs,
  canContinueEarly,
  isRoundComplete,
} from '../src/features/pause/domain/breathing';

const steady = BREATH_PACES.steady;
const slow = BREATH_PACES.slow;

describe('breathAt', () => {
  it('starts empty and breathing in', () => {
    const s = breathAt(0, steady);
    expect(s.phase).toBe('inhale');
    expect(s.fullness).toBeCloseTo(0, 5);
    expect(s.breath).toBe(0);
  });

  it('is full at the top of the breath, then starts breathing out', () => {
    const top = breathAt(steady.inhaleMs, steady);
    expect(top.phase).toBe('exhale');
    expect(top.phaseProgress).toBe(0);
    expect(top.fullness).toBeCloseTo(1, 5);
  });

  it('is empty again at the end of the out-breath, and the next breath begins', () => {
    const next = breathAt(breathLengthMs(steady), steady);
    expect(next.phase).toBe('inhale');
    expect(next.breath).toBe(1);
    expect(next.fullness).toBeCloseTo(0, 5);
  });

  it('is half full half way through the in-breath and half way through the out-breath', () => {
    expect(breathAt(steady.inhaleMs / 2, steady).fullness).toBeCloseTo(0.5, 5);
    expect(breathAt(steady.inhaleMs + steady.exhaleMs / 2, steady).fullness).toBeCloseTo(0.5, 5);
  });

  it('never leaves 0 to 1 and rises in, falls out', () => {
    let previous = 0;
    for (let t = 0; t <= steady.inhaleMs; t += 100) {
      const f = breathAt(t, steady).fullness;
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
      expect(f).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = f;
    }
    for (let t = steady.inhaleMs; t <= breathLengthMs(steady); t += 100) {
      const f = breathAt(t, steady).fullness;
      expect(f).toBeLessThanOrEqual(previous + 1e-9);
      previous = f;
    }
  });

  it('breathes out for longer than it breathes in, at both paces', () => {
    expect(steady.exhaleMs).toBeGreaterThan(steady.inhaleMs);
    expect(slow.exhaleMs).toBeGreaterThan(slow.inhaleMs);
    expect(slow.inhaleMs + slow.exhaleMs).toBeGreaterThan(steady.inhaleMs + steady.exhaleMs);
  });

  it('treats negative and non-finite times as the start', () => {
    expect(breathAt(-500, steady)).toEqual(breathAt(0, steady));
    expect(breathAt(Number.NaN, steady)).toEqual(breathAt(0, steady));
    expect(breathAt(Number.POSITIVE_INFINITY, steady)).toEqual(breathAt(0, steady));
  });

  it('keeps counting breaths over a long time', () => {
    expect(breathAt(breathLengthMs(steady) * 5 + 100, steady).breath).toBe(5);
  });
});

describe('a round', () => {
  it('is a whole number of breaths at both paces, so it ends on an empty lung', () => {
    expect(ROUND_MS % breathLengthMs(steady)).toBe(0);
    expect(ROUND_MS % breathLengthMs(slow)).toBe(0);
  });

  it('is complete at the end of the round and not before', () => {
    expect(isRoundComplete(ROUND_MS - 1)).toBe(false);
    expect(isRoundComplete(ROUND_MS)).toBe(true);
    expect(isRoundComplete(ROUND_MS + 5000)).toBe(true);
  });

  it('lets someone move on after one full breath, not before', () => {
    expect(canContinueEarly(breathLengthMs(steady) - 1, steady)).toBe(false);
    expect(canContinueEarly(breathLengthMs(steady), steady)).toBe(true);
    expect(canContinueEarly(breathLengthMs(steady), slow)).toBe(false);
    expect(canContinueEarly(breathLengthMs(slow), slow)).toBe(true);
  });
});
