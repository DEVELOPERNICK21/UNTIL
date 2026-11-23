/**
 * The breathing patterns of Pause. Pure: no React, no timers. The screen asks "where in the breath
 * are we after this many milliseconds?" and draws the answer.
 *
 * Every pattern is a cycle of phases. A phase moves how full the lungs are from one level to another
 * (0 empty, 1 full): breathing in rises, breathing out falls, a hold stays put.
 *
 *   sigh      two quick breaths in through the nose, then one long breath out ("cyclic sighing")
 *   coherent  5.5 s in, 5.5 s out: about 5.5 breaths a minute, the slow rhythm studied for heart-rate variability
 *   box       4 in, 4 hold, 4 out, 4 hold
 *   extended  4 in, 6 out: the long out-breath is what settles the body
 *   wind      4 in, 7 hold, 8 out (4-7-8), for winding down
 */

export type BreathPhaseKind = 'inhale' | 'top' | 'hold' | 'exhale' | 'rest';
export type BreathTechniqueId = 'sigh' | 'coherent' | 'box' | 'extended' | 'wind';

export interface PhaseSpec {
  kind: BreathPhaseKind;
  ms: number;
  /** Lung fullness at the start of the phase, 0 to 1. */
  from: number;
  /** Lung fullness at the end of the phase. */
  to: number;
}

export const BREATH_TECHNIQUES: Record<BreathTechniqueId, readonly PhaseSpec[]> = {
  sigh: [
    { kind: 'inhale', ms: 2000, from: 0, to: 0.8 },
    { kind: 'top', ms: 1000, from: 0.8, to: 1 },
    { kind: 'exhale', ms: 6000, from: 1, to: 0 },
  ],
  coherent: [
    { kind: 'inhale', ms: 5500, from: 0, to: 1 },
    { kind: 'exhale', ms: 5500, from: 1, to: 0 },
  ],
  box: [
    { kind: 'inhale', ms: 4000, from: 0, to: 1 },
    { kind: 'hold', ms: 4000, from: 1, to: 1 },
    { kind: 'exhale', ms: 4000, from: 1, to: 0 },
    { kind: 'rest', ms: 4000, from: 0, to: 0 },
  ],
  extended: [
    { kind: 'inhale', ms: 4000, from: 0, to: 1 },
    { kind: 'exhale', ms: 6000, from: 1, to: 0 },
  ],
  wind: [
    { kind: 'inhale', ms: 4000, from: 0, to: 1 },
    { kind: 'hold', ms: 7000, from: 1, to: 1 },
    { kind: 'exhale', ms: 8000, from: 1, to: 0 },
  ],
};

export interface BreathState {
  phase: BreathPhaseKind;
  phaseIndex: number;
  /** 0 at the start of the current phase, 1 at its end. */
  phaseProgress: number;
  /** Milliseconds left in this phase. */
  phaseRemainingMs: number;
  /** How full the lungs are, 0 to 1, eased so the orb slows at the top and the bottom. */
  fullness: number;
  /** Which breath this is, counting from 0. */
  breath: number;
}

export function cycleMs(id: BreathTechniqueId): number {
  return BREATH_TECHNIQUES[id].reduce((sum, phase) => sum + phase.ms, 0);
}

function ease(progress: number): number {
  return (1 - Math.cos(Math.PI * progress)) / 2;
}

export function breathAt(elapsedMs: number, id: BreathTechniqueId): BreathState {
  const phases = BREATH_TECHNIQUES[id];
  const length = cycleMs(id);
  const t = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const breath = Math.floor(t / length);
  let within = t - breath * length;

  for (let index = 0; index < phases.length; index += 1) {
    const phase = phases[index];
    if (within < phase.ms || index === phases.length - 1) {
      const phaseProgress = Math.min(1, within / phase.ms);
      return {
        phase: phase.kind,
        phaseIndex: index,
        phaseProgress,
        phaseRemainingMs: Math.max(0, phase.ms - within),
        fullness: phase.from + (phase.to - phase.from) * ease(phaseProgress),
        breath,
      };
    }
    within -= phase.ms;
  }
  /* istanbul ignore next: the loop always returns on its last phase */
  throw new Error('unreachable');
}

/** A session is a whole number of breaths, so it ends on an empty lung. At least one breath. */
export function sessionMs(id: BreathTechniqueId, seconds: number): number {
  const length = cycleMs(id);
  return Math.max(1, Math.ceil((seconds * 1000) / length)) * length;
}

/** Someone who is ready to move on can do so after one full breath, not before. */
export function canContinueEarly(elapsedMs: number, id: BreathTechniqueId): boolean {
  return elapsedMs >= cycleMs(id);
}
