import { useCallback } from 'react';
import {
  clearSharePromptPendingUseCase,
  clearWidgetCoachPendingUseCase,
  getEngagementModalStateUseCase,
  markFeatureCoachShownUseCase,
  maybeRequestInAppReviewUseCase,
} from '../di';
import { getLocalDateKey } from '../domain/notifications/retentionNotificationCopy';
import type { EngagementModalState } from '../domain/repository/IEngagementRepository';

export function useEngagementModals(): {
  readModalState: () => EngagementModalState;
  dismissWidgetCoach: () => void;
  dismissFeatureCoach: () => void;
  dismissSharePrompt: () => void;
  completeFeatureCoachCta: () => void;
  tryCountdownReview: (blockingOverlayVisible: boolean) => void;
  tryOpensReview: (blockingOverlayVisible: boolean) => void;
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

  const tryCountdownReview = useCallback((blockingOverlayVisible: boolean) => {
    void maybeRequestInAppReviewUseCase.execute({
      source: 'countdown',
      blockingOverlayVisible,
      todayDateKey: getLocalDateKey(new Date()),
    });
  }, []);

  const tryOpensReview = useCallback((blockingOverlayVisible: boolean) => {
    void maybeRequestInAppReviewUseCase.execute({
      source: 'opens',
      blockingOverlayVisible,
      todayDateKey: getLocalDateKey(new Date()),
    });
  }, []);

  const dismissSharePrompt = useCallback(() => {
    clearSharePromptPendingUseCase.execute();
    tryCountdownReview(false);
  }, [tryCountdownReview]);

  return {
    readModalState,
    dismissWidgetCoach,
    dismissFeatureCoach,
    dismissSharePrompt,
    completeFeatureCoachCta,
    tryCountdownReview,
    tryOpensReview,
  };
}
