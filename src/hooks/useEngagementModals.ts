import { useCallback } from 'react';
import {
  clearSharePromptPendingUseCase,
  clearWidgetCoachPendingUseCase,
  getEngagementModalStateUseCase,
  markFeatureCoachShownUseCase,
} from '../di';
import type { EngagementModalState } from '../domain/repository/IEngagementRepository';

export function useEngagementModals(): {
  readModalState: () => EngagementModalState;
  dismissWidgetCoach: () => void;
  dismissFeatureCoach: () => void;
  dismissSharePrompt: () => void;
  completeFeatureCoachCta: () => void;
} {
  const readModalState = useCallback(
    () => getEngagementModalStateUseCase.execute(),
    []
  );

  const dismissWidgetCoach = useCallback(() => {
    clearWidgetCoachPendingUseCase.execute();
  }, []);

  const dismissFeatureCoach = useCallback(() => {
    markFeatureCoachShownUseCase.execute();
  }, []);

  const completeFeatureCoachCta = useCallback(() => {
    markFeatureCoachShownUseCase.execute();
  }, []);

  const dismissSharePrompt = useCallback(() => {
    clearSharePromptPendingUseCase.execute();
  }, []);

  return {
    readModalState,
    dismissWidgetCoach,
    dismissFeatureCoach,
    dismissSharePrompt,
    completeFeatureCoachCta,
  };
}
