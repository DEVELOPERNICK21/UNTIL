/**
 * Pause's calm minutes for the screens: today, the week, the level, and recording a finished practice.
 */

import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getPauseProgressUseCase, recordPauseSessionUseCase } from '../../../app/di';
import { now as clockNow, todayIso } from '../../../shared/time/clock';
import { widgetSync } from '../../../shared/platform/widgetSync';
import {
  DAILY_GOAL_SECONDS,
  levelFor,
  secondsToday,
  weekDays,
  type PauseProgress,
} from '../domain/pauseProgress';
import type { PracticeId } from '../domain/practices';
import type { RecordedSession } from '../domain/useCases/RecordPauseSessionUseCase';

export function usePauseProgress() {
  const [progress, setProgress] = useState<PauseProgress>(() => getPauseProgressUseCase.execute());

  // Fresh numbers every time the screen comes back into view (after a session, for example).
  useFocusEffect(
    useCallback(() => {
      setProgress(getPauseProgressUseCase.execute());
    }, []),
  );

  const view = useMemo(() => {
    const today = todayIso();
    return {
      todaySeconds: secondsToday(progress, today),
      goalSeconds: DAILY_GOAL_SECONDS,
      week: weekDays(progress, today),
      level: levelFor(progress.totalSeconds),
    };
  }, [progress]);

  const record = useCallback((practice: PracticeId, seconds: number): RecordedSession => {
    const now = clockNow();
    const result = recordPauseSessionUseCase.execute({
      practice,
      seconds,
      date: todayIso(),
      hour: now.getHours(),
    });
    setProgress(result.progress);
    // The Breathe widget and the island's Calm view show today's minutes; tell them.
    try {
      widgetSync.syncPauseGlance();
    } catch {
      // The widgets are a nicety; a failed sync must never break finishing a session.
    }
    return result;
  }, []);

  return { progress, ...view, record };
}
