/**
 * Engagement feature: app-open side effects, in-app review, coach prompts.
 */

import { TrackAppOpenUseCase } from '../../features/engagement/domain/useCases/TrackAppOpenUseCase';
import { MaybeRequestInAppReviewUseCase } from '../../features/engagement/domain/useCases/MaybeRequestInAppReviewUseCase';
import { logAnalyticsEvent } from '../../shared/analytics/analytics';
import { RequestInAppReviewFromSettingsUseCase } from '../../features/engagement/domain/useCases/RequestInAppReviewFromSettingsUseCase';
import { RunAppOpenSideEffectsUseCase } from '../../features/engagement/domain/useCases/RunAppOpenSideEffectsUseCase';
import { GetEngagementModalStateUseCase } from '../../features/engagement/domain/useCases/GetEngagementModalStateUseCase';
import { SetWidgetCoachPendingUseCase } from '../../features/engagement/domain/useCases/SetWidgetCoachPendingUseCase';
import { ClearWidgetCoachPendingUseCase } from '../../features/engagement/domain/useCases/ClearWidgetCoachPendingUseCase';
import { MarkFeatureCoachShownUseCase } from '../../features/engagement/domain/useCases/MarkFeatureCoachShownUseCase';
import { ClearSharePromptPendingUseCase } from '../../features/engagement/domain/useCases/ClearSharePromptPendingUseCase';
import { GetReminderOptInDueUseCase } from '../../features/engagement/domain/useCases/GetReminderOptInDueUseCase';
import { RecordReminderOptInAskUseCase } from '../../features/engagement/domain/useCases/RecordReminderOptInAskUseCase';
import { getRetentionNotificationsEnabled } from '../../features/engagement/services/retentionNotifications';
import {
  engagementRepository,
  inAppReviewService,
  reminderOptInStore,
  subscriptionRepository,
} from './repositories';
import { syncTrialPreviewUseCase } from './premium';
import { checkCountdownCompletionUseCase } from './countdowns';
import { recordPresenceUseCase } from './presence';

export const trackAppOpenUseCase = new TrackAppOpenUseCase(
  subscriptionRepository,
  syncTrialPreviewUseCase
);

export const maybeRequestInAppReviewUseCase = new MaybeRequestInAppReviewUseCase(
  inAppReviewService,
  engagementRepository,
  subscriptionRepository,
  (name, params) => {
    void logAnalyticsEvent(name, params);
  }
);

export const requestInAppReviewFromSettingsUseCase =
  new RequestInAppReviewFromSettingsUseCase(inAppReviewService, (name, params) => {
    void logAnalyticsEvent(name, params);
  });

export const runAppOpenSideEffectsUseCase = new RunAppOpenSideEffectsUseCase(
  trackAppOpenUseCase,
  subscriptionRepository,
  engagementRepository,
  checkCountdownCompletionUseCase,
  recordPresenceUseCase,
);

export const getEngagementModalStateUseCase = new GetEngagementModalStateUseCase(
  engagementRepository
);

export const setWidgetCoachPendingUseCase = new SetWidgetCoachPendingUseCase(
  engagementRepository
);

export const clearWidgetCoachPendingUseCase = new ClearWidgetCoachPendingUseCase(
  engagementRepository
);

export const markFeatureCoachShownUseCase = new MarkFeatureCoachShownUseCase(
  engagementRepository
);

export const clearSharePromptPendingUseCase = new ClearSharePromptPendingUseCase(
  engagementRepository
);

export const getReminderOptInDueUseCase = new GetReminderOptInDueUseCase(
  reminderOptInStore,
  () => subscriptionRepository.getAppOpenCount(),
  getRetentionNotificationsEnabled
);

export const recordReminderOptInAskUseCase = new RecordReminderOptInAskUseCase(
  reminderOptInStore
);
