import { useCallback, useEffect, useState } from 'react';
import { getDailyReflectionUseCase } from '../di';
import type { DailyReflectionState, ReflectionTone } from '../domain/reflections/reflectionTypes';
import { useAccessControl } from './useAccessControl';
import { useObserveTimeState } from './useObserveTimeState';

export function useDailyReflection() {
  const { userProfile, timeState } = useObserveTimeState();
  const { access, hasPremiumBundle } = useAccessControl();
  const [state, setState] = useState<DailyReflectionState>(() =>
    getDailyReflectionUseCase.execute()
  );

  const refresh = useCallback(() => {
    setState(getDailyReflectionUseCase.execute());
  }, []);

  useEffect(() => {
    refresh();
  }, [
    refresh,
    userProfile.birthDate,
    timeState.day,
    timeState.month,
    timeState.year,
    timeState.life,
    access.trialActive,
    access.isPremium,
    hasPremiumBundle,
  ]);

  const dismiss = useCallback(() => {
    getDailyReflectionUseCase.dismissForDay(state.reflection.dateKey);
    refresh();
  }, [refresh, state.reflection.dateKey]);

  const setTone = useCallback(
    (tone: ReflectionTone) => {
      getDailyReflectionUseCase.setTone(tone);
      refresh();
    },
    [refresh]
  );

  return {
    ...state,
    dismiss,
    setTone,
  };
}
