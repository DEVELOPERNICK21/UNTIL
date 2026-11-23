/**
 * The practices Pause offers, and which one suits which moment. Pure.
 *
 * Evidence is shown to the person, honestly. "strong" is one randomized trial or more; "little" means
 * a popular technique with almost no direct research. Nothing here is a treatment, and nothing is locked:
 * a calming tool that has to be earned is no use to someone in a bad moment.
 */

import type { BreathTechniqueId } from './breathing';

export type PracticeId = BreathTechniqueId | 'grounding';
export type EvidenceLevel = 'strong' | 'good' | 'early' | 'little' | 'indirect';

export interface Practice {
  id: PracticeId;
  kind: 'breath' | 'grounding';
  evidence: EvidenceLevel;
  /** Lengths on offer, in seconds. */
  durations: readonly number[];
  defaultSeconds: number;
}

const BREATH_LENGTHS = [60, 180, 300] as const;

/** In display order. */
export const PRACTICES: readonly Practice[] = [
  { id: 'sigh', kind: 'breath', evidence: 'strong', durations: BREATH_LENGTHS, defaultSeconds: 60 },
  { id: 'coherent', kind: 'breath', evidence: 'good', durations: BREATH_LENGTHS, defaultSeconds: 180 },
  { id: 'box', kind: 'breath', evidence: 'early', durations: BREATH_LENGTHS, defaultSeconds: 180 },
  { id: 'extended', kind: 'breath', evidence: 'good', durations: BREATH_LENGTHS, defaultSeconds: 180 },
  { id: 'wind', kind: 'breath', evidence: 'little', durations: BREATH_LENGTHS, defaultSeconds: 180 },
  { id: 'grounding', kind: 'grounding', evidence: 'indirect', durations: [120], defaultSeconds: 120 },
];

export function practiceById(id: PracticeId): Practice {
  const found = PRACTICES.find(practice => practice.id === id);
  if (!found) throw new Error(`unknown practice ${id}`);
  return found;
}

/** The panic button: the practice with the best evidence for the shortest time, one minute. */
export const QUICK_RELIEF: PracticeId = 'sigh';
export const QUICK_RELIEF_SECONDS = 60;

/** For someone still tight after a round: a slower, gentler rhythm. */
export function gentlerThan(id: PracticeId): BreathTechniqueId {
  return id === 'coherent' ? 'extended' : 'coherent';
}

/** What suits the hour (0 to 23): steady in the morning, a reset at midday, unwind in the evening, wind down at night. */
export function recommendFor(hour: number): PracticeId {
  if (hour >= 5 && hour < 11) return 'coherent';
  if (hour >= 11 && hour < 17) return 'box';
  if (hour >= 17 && hour < 21) return 'extended';
  return 'wind';
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export function dayPartOf(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}
