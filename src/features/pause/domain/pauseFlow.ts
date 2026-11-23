/**
 * The steps of a Pause and how someone moves between them. Pure: the screen holds the state and
 * sends actions, this decides what comes next.
 *
 *   breathe -> checkIn -> weight -> path -> close
 *
 * "Still tight" after a round goes back to breathing, slower, once. After that it moves on instead of
 * trapping the person in a loop, and the closing step points to real help.
 */

import type { BreathPaceName } from './breathing';

export type PauseStep = 'breathe' | 'checkIn' | 'weight' | 'path' | 'close';
export type Feeling = 'calmer' | 'same' | 'tight';

/** What feels heavy. Each has its own short path in the last step. */
export type Weight = 'load' | 'time' | 'event' | 'night' | 'unsure';
export const WEIGHTS: readonly Weight[] = ['load', 'time', 'event', 'night', 'unsure'];

export const MAX_ROUNDS = 2;

export interface PauseState {
  step: PauseStep;
  /** Which round of breathing, from 1. */
  round: number;
  pace: BreathPaceName;
  weight: Weight | null;
  /** Still tight after the last round. The closing step then offers more than a breath. */
  stillTight: boolean;
  /** The one thing chosen for ten minutes. Kept in memory for the closing step, never stored. */
  focus: string | null;
}

export type PauseAction =
  | { type: 'breathDone' }
  | { type: 'feeling'; feeling: Feeling }
  /** `null` skips the question. */
  | { type: 'weight'; weight: Weight | null }
  | { type: 'pathDone'; focus?: string };

export const initialPauseState: PauseState = {
  step: 'breathe',
  round: 1,
  pace: 'steady',
  weight: null,
  stillTight: false,
  focus: null,
};

export function pauseReducer(state: PauseState, action: PauseAction): PauseState {
  switch (action.type) {
    case 'breathDone':
      return state.step === 'breathe' ? { ...state, step: 'checkIn' } : state;

    case 'feeling': {
      if (state.step !== 'checkIn') return state;
      if (action.feeling !== 'tight') {
        return { ...state, step: 'weight', stillTight: false };
      }
      if (state.round < MAX_ROUNDS) {
        return { ...state, step: 'breathe', round: state.round + 1, pace: 'slow', stillTight: false };
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
