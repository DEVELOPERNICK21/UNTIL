/**
 * Follows one round of breathing and tells the screen which word to show, when moving on is allowed,
 * and when the round is over. The timing itself lives in domain/breathing.
 */

import { useEffect, useRef, useState } from 'react';
import {
  BREATH_PACES,
  breathAt,
  canContinueEarly,
  isRoundComplete,
  type BreathPaceName,
  type BreathPhase,
} from '../domain/breathing';

const TICK_MS = 100;

interface Options {
  pace: BreathPaceName;
  /** Called once, when the round is over. */
  onRoundComplete: () => void;
  /** Report how far through the current phase we are (for the Reduce Motion bar). Off by default: it re-renders every tick. */
  trackProgress?: boolean;
}

export function useBreathing({ pace, onRoundComplete, trackProgress = false }: Options) {
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [canContinue, setCanContinue] = useState(false);
  const [phaseProgress, setPhaseProgress] = useState(0);

  const onCompleteRef = useRef(onRoundComplete);
  useEffect(() => {
    onCompleteRef.current = onRoundComplete;
  }, [onRoundComplete]);

  useEffect(() => {
    const timing = BREATH_PACES[pace];
    const startedAt = Date.now();
    let finished = false;

    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const state = breathAt(elapsed, timing);
      setPhase(state.phase);
      setCanContinue(canContinueEarly(elapsed, timing));
      if (trackProgress) setPhaseProgress(state.phaseProgress);

      if (!finished && isRoundComplete(elapsed)) {
        finished = true;
        clearInterval(id);
        onCompleteRef.current();
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [pace, trackProgress]);

  return { phase, canContinue, phaseProgress };
}
