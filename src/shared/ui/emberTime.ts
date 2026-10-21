/**
 * The maths behind Ember's body. Everything here is a plain function of day progress, so the
 * mascot always agrees with the numbers on screen and can be tested without rendering.
 */

import { progressBand, type ProgressBand } from '../theme/emotionalCopy';

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export type EmberVitals = {
  mood: ProgressBand;
  /** Share of the day still ahead, 0..1. The bright part of the ring. */
  left: number;
  /** Body size. Ember burns a little smaller as the day goes. */
  flame: number;
  /** How many rising or falling sparks to draw. */
  sparkCount: number;
  /** Sparks rise like fire in the first half and fall like sand once the day is mostly gone. */
  sparksFall: boolean;
  /** Late evening: heavy eyes, slow breathing, drifting z. */
  sleepy: boolean;
  /** The first hour of a new day: a bit groggy, yawns more often. */
  waking: boolean;
};

export const MAX_SPARKS = 6;

export function emberVitals(progress: number, moodOverride?: ProgressBand): EmberVitals {
  const p = clamp01(progress);
  return {
    mood: moodOverride ?? progressBand(p),
    left: 1 - p,
    flame: 1 - 0.12 * p,
    sparkCount: Math.max(2, Math.round(MAX_SPARKS - 4 * p)),
    sparksFall: p >= 0.65,
    sleepy: p >= 0.93,
    waking: p < 0.04,
  };
}

/** Where the moment-of-now dot sits on the day ring. Degrees clockwise from the top. */
export function dayRingAngle(progress: number): number {
  return clamp01(progress) * 360;
}

/**
 * The angle to animate a hand to so it takes the shortest way round. Keeps counting up instead of
 * snapping back at 12, so a hand never spins backwards across the top.
 */
export function nextAngle(previous: number, target: number): number {
  const delta = ((((target - previous) % 360) + 540) % 360) - 180;
  return previous + delta;
}

/** What Ember tells you when you hold it. */
export function timeLeftLabel(progress: number): string {
  const minutes = Math.round((1 - clamp01(progress)) * 24 * 60);
  if (minutes <= 0) return 'Today is done';
  if (minutes >= 1440) return 'A whole new day';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m left today`;
  if (m === 0) return `${h}h left today`;
  return `${h}h ${m}m left today`;
}

// ---------------------------------------------------------------------------------------------
// Keyframes for Animated.Value.interpolate. One slow linear loop drives many motions; each motion
// is a keyframe list over that loop, so a whole Ember runs on a handful of native animations.
// ---------------------------------------------------------------------------------------------

export type Keyframes = { inputRange: number[]; outputRange: number[] };

/** A sine wave that repeats `cycles` times across one pass of the driver. */
export function waveKeyframes(
  cycles: number,
  amplitude: number,
  base = 0,
  phaseTurns = 0,
  stepsPerCycle = 8,
): Keyframes {
  const steps = Math.max(1, Math.round(cycles * stepsPerCycle));
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    inputRange.push(u);
    outputRange.push(base + amplitude * Math.sin(2 * Math.PI * (cycles * u + phaseTurns)));
  }
  return { inputRange, outputRange };
}

function sampleKeyframes(stops: number[], values: number[], u: number): number {
  if (u <= stops[0]) return values[0];
  for (let i = 1; i < stops.length; i++) {
    if (u <= stops[i]) {
      const span = stops[i] - stops[i - 1];
      const k = span === 0 ? 1 : (u - stops[i - 1]) / span;
      return values[i - 1] + (values[i] - values[i - 1]) * k;
    }
  }
  return values[values.length - 1];
}

const SEAM = 1e-4;

/**
 * Shifts a one-shot keyframe curve (stops 0..1) so it starts part way through. Lets six sparks share
 * one looping driver and still fall out of step with each other.
 */
export function phaseKeyframes(phase: number, stops: number[], values: number[]): Keyframes {
  const shift = ((phase % 1) + 1) % 1;
  if (shift < SEAM * 10 || shift > 1 - SEAM * 10) {
    return { inputRange: stops, outputRange: values };
  }
  const inputRange: number[] = [0];
  const outputRange: number[] = [sampleKeyframes(stops, values, shift)];
  stops.forEach((s, i) => {
    if (s > shift && s < 1) {
      inputRange.push(s - shift);
      outputRange.push(values[i]);
    }
  });
  inputRange.push(1 - shift);
  outputRange.push(sampleKeyframes(stops, values, 1));
  inputRange.push(1 - shift + SEAM);
  outputRange.push(sampleKeyframes(stops, values, 0));
  stops.forEach((s, i) => {
    if (s > 0 && s < shift) {
      inputRange.push(s + 1 - shift);
      outputRange.push(values[i]);
    }
  });
  inputRange.push(1);
  outputRange.push(sampleKeyframes(stops, values, shift));
  return { inputRange, outputRange };
}

/** Evaluates keyframes the way Animated.interpolate would. Exported for tests. */
export function evaluateKeyframes(frames: Keyframes, t: number): number {
  return sampleKeyframes(frames.inputRange, frames.outputRange, t);
}
