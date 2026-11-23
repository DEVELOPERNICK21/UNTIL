/**
 * The steps of one Pause session and how someone moves between them. Pure: the screen holds the state
 * and sends actions, this decides what comes next.
 *
 *   ready -> breathe -> checkIn -> weight -> path -> close
 *
 * "Ready" is skipped for the panic button ("I need calm now"): that one starts breathing at once.
 * "Still tight" after a round goes back to practising, with a gentler rhythm, once. After that it moves
 * on instead of trapping the person in a loop, and the closing step points to real help.
 */

import { gentlerThan, practiceById, type PracticeId } from './practices';

export type PauseStep = 'ready' | 'breathe' | 'checkIn' | 'weight' | 'path' | 'close';
export type Feeling = 'calmer' | 'same' | 'tight';

/** What feels heavy. Each has its own short path after the practice. */
export type Weight = 'load' | 'time' | 'event' | 'night' | 'unsure';
export const WEIGHTS: readonly Weight[] = ['load', 'time', 'event', 'night', 'unsure'];

export const MAX_ROUNDS = 2;

export interface PauseState {
  step: PauseStep;
  /** Which round of practising, from 1. */
  round: number;
  practice: PracticeId;
  /** How long a round is meant to last, in seconds. */
  seconds: number;
  /** Seconds actually practised so far, over every round. This is what counts as calm. */
  practiceSeconds: number;
  weight: Weight | null;
  /** Still tight after the last round. The closing step then offers more than a breath. */
  stillTight: boolean;
  /** The one thing chosen for ten minutes. Kept in memory for the closing step, never stored. */
  focus: string | null;
}

export type PauseAction =
  | { type: 'start'; seconds: number }
  /** `seconds` is how long was practised in this round. */
  | { type: 'practiceDone'; seconds: number }
  | { type: 'feeling'; feeling: Feeling }
  /** `null` skips the question. */
  | { type: 'weight'; weight: Weight | null }
  | { type: 'pathDone'; focus?: string };

export function initialPauseState(practice: PracticeId, instant: boolean): PauseState {
  return {
    step: instant ? 'breathe' : 'ready',
    round: 1,
    practice,
    seconds: practiceById(practice).defaultSeconds,
    practiceSeconds: 0,
    weight: null,
    stillTight: false,
    focus: null,
  };
}

export function pauseReducer(state: PauseState, action: PauseAction): PauseState {
  switch (action.type) {
    case 'start':
      return state.step === 'ready' ? { ...state, step: 'breathe', seconds: action.seconds } : state;

    case 'practiceDone':
      return state.step === 'breathe'
        ? {
            ...state,
            step: 'checkIn',
            practiceSeconds: state.practiceSeconds + Math.max(0, Math.round(action.seconds)),
          }
        : state;

    case 'feeling': {
      if (state.step !== 'checkIn') return state;
      if (action.feeling !== 'tight') {
        return { ...state, step: 'weight', stillTight: false };
      }
      if (state.round < MAX_ROUNDS) {
        return {
          ...state,
          step: 'breathe',
          round: state.round + 1,
          practice: gentlerThan(state.practice),
          seconds: Math.max(60, Math.min(state.seconds, 180)),
          stillTight: false,
        };
      }
      return { ...state, step: 'weight', stillTight: true };
    }

    case 'weight':
      if (state.step !== 'weight') return state;
      return action.weight === null
        ? { ...state, step: 'close', weight: null }
        : { ...state, step: 'path', weight: action.weight };

    case 'pathDone':
      return state.step === 'path'
        ? { ...state, step: 'close', focus: action.focus?.trim() || null }
        : state;

    default:
      return state;
  }
}
