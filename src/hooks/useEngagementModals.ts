import { useCallback } from 'react';
import {
  clearSharePromptPendingUseCase,
  clearWidgetCoachPendingUseCase,
  getAccessStateUseCase,
  getEngagementModalStateUseCase,
  markFeatureCoachShownUseCase,
  maybeRequestInAppReviewUseCase,
} from '../di';
import { getLocalDateKey } from '../domain/notifications/retentionNotificationCopy';
import type { EngagementModalState } from '../domain/repository/IEngagementRepository';
import { shouldShowDeferredPaywall } from '../services/deferredPaywall';

export function useEngagementModals(): {
  readModalState: () => EngagementModalState;
  readDeferredPaywallDue: () => boolean;
  dismissWidgetCoach: () => void;
  dismissFeatureCoach: () => void;
  dismissSharePrompt: () => void;
  completeFeatureCoachCta: () => void;
  tryCountdownReview: (blockingOverlayVisible: boolean) => Promise<boolean>;
  tryOpensReview: (blockingOverlayVisible: boolean) => Promise<boolean>;
} {
  const readModalState = useCallback(
    () => getEngagementModalStateUseCase.execute(),
    []
  );

  const readDeferredPaywallDue = useCallback(
    () => shouldShowDeferredPaywall(getAccessStateUseCase.execute()),
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
    return maybeRequestInAppReviewUseCase.execute({
      source: 'countdown',
      blockingOverlayVisible,
      todayDateKey: getLocalDateKey(new Date()),
    });
  }, []);

  const tryOpensReview = useCallback((blockingOverlayVisible: boolean) => {
    return maybeRequestInAppReviewUseCase.execute({
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
    readDeferredPaywallDue,
    dismissWidgetCoach,
    dismissFeatureCoach,
    dismissSharePrompt,
    completeFeatureCoachCta,
    tryCountdownReview,
    tryOpensReview,
  };
}
