/**
 * The breathing patterns of Pause: where in the breath we are, for every pattern.
 */

import {
  BREATH_TECHNIQUES,
  breathAt,
  canContinueEarly,
  cycleMs,
  sessionMs,
  type BreathTechniqueId,
} from '../src/features/pause/domain/breathing';

const IDS = Object.keys(BREATH_TECHNIQUES) as BreathTechniqueId[];

describe('the patterns', () => {
  it('have the lengths they claim', () => {
    expect(cycleMs('sigh')).toBe(9000); // 2 + 1 in, 6 out
    expect(cycleMs('coherent')).toBe(11000); // 5.5 in, 5.5 out
    expect(cycleMs('box')).toBe(16000); // 4 x 4
    expect(cycleMs('extended')).toBe(10000); // 4 in, 6 out
    expect(cycleMs('wind')).toBe(19000); // 4-7-8
  });

  it('coherent breathing is about 5.5 breaths a minute, in the slow range studied for heart-rate variability', () => {
    const perMinute = 60000 / cycleMs('coherent');
    expect(perMinute).toBeGreaterThan(5);
    expect(perMinute).toBeLessThan(6.5);
  });

  it('box breathing is four equal sides, and 4-7-8 is 4, 7 and 8', () => {
    expect(BREATH_TECHNIQUES.box.map(p => p.ms)).toEqual([4000, 4000, 4000, 4000]);
    expect(BREATH_TECHNIQUES.wind.map(p => [p.kind, p.ms])).toEqual([
      ['inhale', 4000],
      ['hold', 7000],
      ['exhale', 8000],
    ]);
  });

  it('cyclic sighing is a double breath in (the second a small top-up) and one long breath out', () => {
    const sigh = BREATH_TECHNIQUES.sigh;
    expect(sigh.map(p => p.kind)).toEqual(['inhale', 'top', 'exhale']);
    expect(sigh[0].to).toBeLessThan(1);
    expect(sigh[1].to).toBe(1);
    expect(sigh[2].ms).toBeGreaterThan(sigh[0].ms + sigh[1].ms);
  });

  it.each(['sigh', 'extended', 'wind'] as const)('%s breathes out for longer than it breathes in', id => {
    const phases = BREATH_TECHNIQUES[id];
    const inMs = phases.filter(p => p.kind === 'inhale' || p.kind === 'top').reduce((s, p) => s + p.ms, 0);
    const outMs = phases.filter(p => p.kind === 'exhale').reduce((s, p) => s + p.ms, 0);
    expect(outMs).toBeGreaterThan(inMs);
  });

  it.each(IDS)('%s is a closed loop: every phase starts where the last one ended, from empty to empty', id => {
    const phases = BREATH_TECHNIQUES[id];
    expect(phases[0].from).toBe(0);
    for (let i = 1; i < phases.length; i += 1) expect(phases[i].from).toBe(phases[i - 1].to);
    expect(phases[phases.length - 1].to).toBe(0);
  });
});

describe('breathAt', () => {
  it.each(IDS)('%s starts empty and breathing in', id => {
    const s = breathAt(0, id);
    expect(s.phase).toBe('inhale');
    expect(s.fullness).toBeCloseTo(0, 5);
    expect(s.breath).toBe(0);
  });

  it.each(IDS)('%s never leaves 0 to 1, and a new breath starts empty', id => {
    for (let t = 0; t <= cycleMs(id) * 2; t += 50) {
      const f = breathAt(t, id).fullness;
      expect(f).toBeGreaterThanOrEqual(-1e-9);
      expect(f).toBeLessThanOrEqual(1 + 1e-9);
    }
    const next = breathAt(cycleMs(id), id);
    expect(next.breath).toBe(1);
    expect(next.fullness).toBeCloseTo(0, 5);
  });

  it('moves through the phases of box breathing in order and holds still', () => {
    expect(breathAt(1000, 'box').phase).toBe('inhale');
    const hold = breathAt(4000 + 1500, 'box');
    expect(hold.phase).toBe('hold');
    expect(hold.fullness).toBeCloseTo(1, 5);
    expect(breathAt(8000 + 1500, 'box').phase).toBe('exhale');
    const rest = breathAt(12000 + 1500, 'box');
    expect(rest.phase).toBe('rest');
    expect(rest.fullness).toBeCloseTo(0, 5);
  });

  it('counts down the seconds left in a phase, for following 4-7-8', () => {
    expect(breathAt(0, 'wind').phaseRemainingMs).toBe(4000);
    expect(breathAt(4000 + 1000, 'wind').phaseRemainingMs).toBe(6000);
    expect(breathAt(4000 + 7000 + 500, 'wind').phase).toBe('exhale');
  });

  it('sighs in twice: the lungs reach about 80 percent, then fill', () => {
    const afterFirst = breathAt(2000, 'sigh');
    expect(afterFirst.phase).toBe('top');
    expect(afterFirst.fullness).toBeCloseTo(0.8, 5);
    const full = breathAt(3000, 'sigh');
    expect(full.phase).toBe('exhale');
    expect(full.fullness).toBeCloseTo(1, 5);
  });

  it('treats negative and non-finite times as the start', () => {
    expect(breathAt(-500, 'box')).toEqual(breathAt(0, 'box'));
    expect(breathAt(Number.NaN, 'sigh')).toEqual(breathAt(0, 'sigh'));
    expect(breathAt(Number.POSITIVE_INFINITY, 'wind')).toEqual(breathAt(0, 'wind'));
  });

  it('keeps counting breaths over a long time', () => {
    expect(breathAt(cycleMs('coherent') * 5 + 100, 'coherent').breath).toBe(5);
  });
});

describe('a session', () => {
  it.each(IDS)('%s lasts a whole number of breaths, so it ends on an empty lung, and at least one', id => {
    for (const seconds of [1, 60, 180, 300]) {
      const ms = sessionMs(id, seconds);
      expect(ms % cycleMs(id)).toBe(0);
      expect(ms).toBeGreaterThanOrEqual(cycleMs(id));
      expect(ms).toBeGreaterThanOrEqual(seconds * 1000);
      expect(ms - seconds * 1000).toBeLessThan(cycleMs(id));
    }
  });

  it('lets someone move on after one full breath, not before', () => {
    expect(canContinueEarly(cycleMs('box') - 1, 'box')).toBe(false);
    expect(canContinueEarly(cycleMs('box'), 'box')).toBe(true);
    expect(canContinueEarly(cycleMs('sigh'), 'wind')).toBe(false);
  });
});
