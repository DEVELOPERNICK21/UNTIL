/**
 * The breathing rhythm of Pause. Pure: no React, no timers. The screen asks "where in the breath are
 * we after this many milliseconds?" and draws the answer.
 *
 * The out-breath is longer than the in-breath on purpose. A slow exhale is what settles the body;
 * 4 seconds in and 6 seconds out is about six breaths a minute. "Slow" is for someone who says it is
 * still tight after a round: 5 in and 7 out.
 */

export type BreathPhase = 'inhale' | 'exhale';
export type BreathPaceName = 'steady' | 'slow';

export interface BreathPace {
  inhaleMs: number;
  exhaleMs: number;
}

export const BREATH_PACES: Record<BreathPaceName, BreathPace> = {
  steady: { inhaleMs: 4000, exhaleMs: 6000 },
  slow: { inhaleMs: 5000, exhaleMs: 7000 },
};

/** One round of breathing. A whole number of breaths at both paces (6 steady, 5 slow). */
export const ROUND_MS = 60_000;

export interface BreathState {
  phase: BreathPhase;
  /** 0 at the start of the current phase, 1 at its end. */
  phaseProgress: number;
  /** How full the lungs are: 0 empty, 1 full. Eased, so the orb slows at the top and the bottom. */
  fullness: number;
  /** Which breath this is, counting from 0. */
  breath: number;
}

export function breathLengthMs(pace: BreathPace): number {
  return pace.inhaleMs + pace.exhaleMs;
}

function ease(progress: number): number {
  return (1 - Math.cos(Math.PI * progress)) / 2;
}

export function breathAt(elapsedMs: number, pace: BreathPace): BreathState {
  const t = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const length = breathLengthMs(pace);
  const breath = Math.floor(t / length);
  const within = t - breath * length;

  if (within < pace.inhaleMs) {
    const phaseProgress = within / pace.inhaleMs;
    return { phase: 'inhale', phaseProgress, fullness: ease(phaseProgress), breath };
  }
  const phaseProgress = (within - pace.inhaleMs) / pace.exhaleMs;
  return { phase: 'exhale', phaseProgress, fullness: 1 - ease(phaseProgress), breath };
}

export function isRoundComplete(elapsedMs: number): boolean {
  return elapsedMs >= ROUND_MS;
}

/** Someone who is ready to move on can do so after one full breath, not before. */
export function canContinueEarly(elapsedMs: number, pace: BreathPace): boolean {
  return elapsedMs >= breathLengthMs(pace);
}
