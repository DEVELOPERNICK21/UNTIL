/** Pure code of the pause feature, for the domain, data and services layers of other features. */

export {
  BREATH_PACES,
  ROUND_MS,
  breathAt,
  breathLengthMs,
  canContinueEarly,
  isRoundComplete,
} from './breathing';
export type { BreathPace, BreathPaceName, BreathPhase, BreathState } from './breathing';
export { MAX_ROUNDS, WEIGHTS, initialPauseState, pauseReducer } from './pauseFlow';
export type { Feeling, PauseAction, PauseState, PauseStep, Weight } from './pauseFlow';
