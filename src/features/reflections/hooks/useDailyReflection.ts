import { useCallback, useEffect, useState } from 'react';
import { getDailyReflectionUseCase } from '../../../app/di';
import type { DailyReflectionState, ReflectionTone } from '../domain/reflectionTypes';
import { useAccessControl } from '../../premium';
import { useObserveTimeState } from '../../time';
import { useTranslation } from '../../../shared/i18n/useTranslation';

export function useDailyReflection() {
  const { userProfile, timeState } = useObserveTimeState();
  const { language } = useTranslation();
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
    language,
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
