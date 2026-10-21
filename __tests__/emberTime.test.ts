import {
  dayRingAngle,
  emberVitals,
  evaluateKeyframes,
  nextAngle,
  phaseKeyframes,
  timeLeftLabel,
  waveKeyframes,
} from '../src/shared/ui/emberTime';

describe('emberVitals', () => {
  it('burns smaller and with fewer sparks as the day goes', () => {
    const dawn = emberVitals(0);
    const dusk = emberVitals(1);
    expect(dawn.flame).toBe(1);
    expect(dusk.flame).toBeCloseTo(0.88);
    expect(dawn.sparkCount).toBe(6);
    expect(dusk.sparkCount).toBe(2);
    expect(dawn.left).toBe(1);
    expect(dusk.left).toBe(0);
  });

  it('sparks rise early and fall once most of the day has gone', () => {
    expect(emberVitals(0.5).sparksFall).toBe(false);
    expect(emberVitals(0.7).sparksFall).toBe(true);
  });

  it('gets sleepy late in the evening and groggy in the first hour', () => {
    expect(emberVitals(0.5).sleepy).toBe(false);
    expect(emberVitals(0.95).sleepy).toBe(true);
    expect(emberVitals(0.02).waking).toBe(true);
    expect(emberVitals(0.2).waking).toBe(false);
  });

  it('keeps a mood that was passed in, and clamps bad progress', () => {
    expect(emberVitals(0.1, 'dusk').mood).toBe('dusk');
    expect(emberVitals(-4).left).toBe(1);
    expect(emberVitals(9).left).toBe(0);
    expect(emberVitals(Number.NaN).left).toBe(1);
  });
});

describe('dayRingAngle', () => {
  it('goes once round the ring across the day', () => {
    expect(dayRingAngle(0)).toBe(0);
    expect(dayRingAngle(0.5)).toBe(180);
    expect(dayRingAngle(1)).toBe(360);
  });
});

describe('nextAngle', () => {
  it('keeps counting up across the top instead of snapping back', () => {
    expect(nextAngle(354, 0)).toBe(360);
    expect(nextAngle(360, 6)).toBe(366);
  });

  it('takes the short way when asked to go back a little', () => {
    expect(nextAngle(100, 90)).toBe(90);
  });
});

describe('timeLeftLabel', () => {
  it('speaks in hours and minutes', () => {
    expect(timeLeftLabel(0.5)).toBe('12h left today');
    expect(timeLeftLabel(0.75)).toBe('6h left today');
    expect(timeLeftLabel(10.5 / 24)).toBe('13h 30m left today');
    expect(timeLeftLabel(23.5 / 24)).toBe('30m left today');
  });

  it('has words for the very start and end of the day', () => {
    expect(timeLeftLabel(0)).toBe('A whole new day');
    expect(timeLeftLabel(1)).toBe('Today is done');
  });

  it('never uses a dash', () => {
    for (let p = 0; p <= 1; p += 0.05) {
      expect(timeLeftLabel(p)).not.toMatch(/[—–]/);
    }
  });
});

describe('waveKeyframes', () => {
  it('loops cleanly: it ends where it starts', () => {
    const wave = waveKeyframes(3, 2, 1);
    expect(wave.outputRange[0]).toBeCloseTo(wave.outputRange.at(-1)!);
    expect(wave.inputRange[0]).toBe(0);
    expect(wave.inputRange.at(-1)).toBe(1);
  });

  it('stays within base plus or minus amplitude', () => {
    const wave = waveKeyframes(2, 0.5, 1);
    wave.outputRange.forEach(v => {
      expect(v).toBeLessThanOrEqual(1.5 + 1e-9);
      expect(v).toBeGreaterThanOrEqual(0.5 - 1e-9);
    });
  });
});

describe('phaseKeyframes', () => {
  const stops = [0, 0.15, 0.7, 1];
  const values = [0, 0.9, 0.45, 0];

  it('is unchanged at phase zero', () => {
    const frames = phaseKeyframes(0, stops, values);
    expect(frames.inputRange).toEqual(stops);
    expect(frames.outputRange).toEqual(values);
  });

  it('starts part way through the curve and wraps back to the start', () => {
    const frames = phaseKeyframes(0.5, stops, values);
    // At the start of the loop it sits half way along the original curve.
    expect(evaluateKeyframes(frames, 0)).toBeCloseTo(evaluateKeyframes({ inputRange: stops, outputRange: values }, 0.5));
    // Half a loop later it has played out the end and started again.
    expect(evaluateKeyframes(frames, 0.5 + 0.15)).toBeCloseTo(0.9);
    // And the loop closes on itself.
    expect(evaluateKeyframes(frames, 1)).toBeCloseTo(evaluateKeyframes(frames, 0));
  });

  it('only ever steps up in time, which Animated requires', () => {
    [0.1, 0.33, 0.5, 0.8, 0.95].forEach(phase => {
      const { inputRange } = phaseKeyframes(phase, stops, values);
      for (let i = 1; i < inputRange.length; i++) {
        expect(inputRange[i]).toBeGreaterThanOrEqual(inputRange[i - 1]);
      }
    });
  });
});
