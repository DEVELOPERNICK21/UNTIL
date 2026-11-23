/**
 * Follows one session of breathing and tells the screen which word to show, how many seconds are left
 * in this part of the breath, how far through the session we are, and when moving on is allowed. The
 * timing itself lives in domain/breathing.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  breathAt,
  canContinueEarly,
  type BreathPhaseKind,
  type BreathTechniqueId,
} from '../domain/breathing';

const TICK_MS = 100;

interface Options {
  technique: BreathTechniqueId;
  /** How long the session lasts, in milliseconds (a whole number of breaths). */
  totalMs: number;
  /** Called once, when the session is over, with the seconds practised. */
  onComplete: (practisedSeconds: number) => void;
  /** Report the session progress for the ring. Off when nothing draws it. */
  trackProgress?: boolean;
}

export interface BreathingView {
  phase: BreathPhaseKind;
  /** Whole seconds left in this part of the breath, counting down: 4, 3, 2, 1. */
  secondsLeft: number;
  canContinue: boolean;
  /** 0 to 1 through the whole session. */
  progress: number;
  /** Seconds practised so far, for a session that is left early. */
  practisedSeconds: () => number;
}

export function useBreathing({ technique, totalMs, onComplete, trackProgress = true }: Options): BreathingView {
  const [view, setView] = useState({
    phase: 'inhale' as BreathPhaseKind,
    secondsLeft: 0,
    canContinue: false,
    progress: 0,
  });

  const startedAt = useRef(Date.now());
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    startedAt.current = Date.now();
    let finished = false;

    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const state = breathAt(elapsed, technique);
      const secondsLeft = Math.ceil(state.phaseRemainingMs / 1000);
      const progress = trackProgress ? Math.min(1, Math.round((elapsed / totalMs) * 200) / 200) : 0;
      const canContinue = canContinueEarly(elapsed, technique);

      setView(prev =>
        prev.phase === state.phase &&
        prev.secondsLeft === secondsLeft &&
        prev.canContinue === canContinue &&
        prev.progress === progress
          ? prev
          : { phase: state.phase, secondsLeft, canContinue, progress },
      );

      if (!finished && elapsed >= totalMs) {
        finished = true;
        clearInterval(id);
        onCompleteRef.current(Math.round(totalMs / 1000));
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [technique, totalMs, trackProgress]);

  const practisedSeconds = useCallback(
    () => Math.min(Math.round(totalMs / 1000), Math.max(0, Math.round((Date.now() - startedAt.current) / 1000))),
    [totalMs],
  );

  return { ...view, practisedSeconds };
}
