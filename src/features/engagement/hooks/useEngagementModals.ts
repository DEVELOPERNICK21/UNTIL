import { useCallback } from 'react';
import {
  clearSharePromptPendingUseCase,
  clearWidgetCoachPendingUseCase,
  getAccessStateUseCase,
  getEngagementModalStateUseCase,
  getReminderOptInDueUseCase,
  markFeatureCoachShownUseCase,
  maybeRequestInAppReviewUseCase,
  recordReminderOptInAskUseCase,
} from '../../../app/di';
import { enableRetentionNotificationsWithPermission } from '../services/retentionNotifications';
import { getLocalDateKey } from '../domain/retentionNotificationCopy';
import type { EngagementModalState } from '../domain/ports/IEngagementRepository';
import { shouldShowDeferredPaywall } from '../../premium';

export function useEngagementModals(): {
  readModalState: () => EngagementModalState;
  readDeferredPaywallDue: () => boolean;
  /** `widgetsOnly`: they told onboarding they only want widgets, so the offer stays quiet. */
  readReminderOptInDue: (widgetsOnly: boolean) => boolean;
  recordReminderOptInAsk: () => void;
  acceptReminderOptIn: () => Promise<boolean>;
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

  const readReminderOptInDue = useCallback(
    (widgetsOnly: boolean) =>
      getReminderOptInDueUseCase.execute({ widgetsOnly }),
    []
  );

  const recordReminderOptInAsk = useCallback(() => {
    recordReminderOptInAskUseCase.execute();
  }, []);

  const acceptReminderOptIn = useCallback(
    () => enableRetentionNotificationsWithPermission('opt_in_sheet'),
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
    readReminderOptInDue,
    recordReminderOptInAsk,
    acceptReminderOptIn,
    dismissWidgetCoach,
    dismissFeatureCoach,
    dismissSharePrompt,
    completeFeatureCoachCta,
    tryCountdownReview,
    tryOpensReview,
  };
}
