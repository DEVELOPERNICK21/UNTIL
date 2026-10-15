/**
 * Composition root - wires infrastructure to domain
 * Single place where repository implementations are instantiated and injected into use cases.
 */

import { Platform } from 'react-native';
import { MmkvTimeRepository } from '../../features/time/data/MmkvTimeRepository';
import { MmkvSubscriptionRepository } from '../../features/premium/data/MmkvSubscriptionRepository';
import { MmkvActivityRepository } from '../../features/activity/data/MmkvActivityRepository';
import { MmkvCustomCounterRepository } from '../../features/counters/data/MmkvCustomCounterRepository';
import { MmkvCountdownRepository } from '../../features/countdowns/data/MmkvCountdownRepository';
import { MmkvTaskRepository } from '../../features/tasks/data/MmkvTaskRepository';
import { MmkvMonthlyGoalRepository } from '../../features/tasks/data/MmkvMonthlyGoalRepository';
import { MmkvOnboardingRepository } from '../../features/onboarding/data/MmkvOnboardingRepository';
import { MmkvEngagementRepository } from '../../features/engagement/data/MmkvEngagementRepository';
import { MmkvPresenceRepository } from '../../features/presence/data/MmkvPresenceRepository';
import { MmkvBadgeRepository } from '../../features/badges/data/MmkvBadgeRepository';
import { MmkvReflectionRepository } from '../../features/reflections/data/MmkvReflectionRepository';
import { MmkvStudentVerificationRepository } from '../../features/premium/data/MmkvStudentVerificationRepository';
import { MmkvAuthSessionRepository } from '../../features/account/data/MmkvAuthSessionRepository';
import { FirebaseAuthServiceAdapter } from '../../features/account/data/FirebaseAuthServiceAdapter';
import { FirestoreAccountCloudStoreAdapter } from '../../features/account/data/FirestoreAccountCloudStoreAdapter';
import { AppUpdateServiceAdapter } from '../../features/app-update/data/AppUpdateServiceAdapter';
import { AppVersionProviderAdapter } from '../../features/app-update/data/AppVersionProviderAdapter';
import { ActivityAnalysisAdapter } from '../../features/activity/data/ActivityAnalysisAdapter';
import { ClockAdapter } from '../../shared/time/ClockAdapter';
import { StoreReviewAdapter } from '../../features/engagement/data/StoreReviewAdapter';
import { ObserveTimeStateUseCase } from '../../features/time/domain/useCases/ObserveTimeStateUseCase';
import { UpdateUserProfileUseCase } from '../../features/time/domain/useCases/UpdateUserProfileUseCase';
import { ObserveSubscriptionUseCase } from '../../features/premium/domain/useCases/ObserveSubscriptionUseCase';
import { UpdateSubscriptionUseCase } from '../../features/premium/domain/useCases/UpdateSubscriptionUseCase';
import { LogActivityUseCase } from '../../features/activity/domain/useCases/LogActivityUseCase';
import { GetCategoryTotalsUseCase } from '../../features/activity/domain/useCases/GetCategoryTotalsUseCase';
import { GetRegretProjectionUseCase } from '../../features/activity/domain/useCases/GetRegretProjectionUseCase';
import { GetInterventionStateUseCase } from '../../features/activity/domain/useCases/GetInterventionStateUseCase';
import { GetDailyLimitNothingUseCase } from '../../features/activity/domain/useCases/GetDailyLimitNothingUseCase';
import { SetDailyLimitNothingUseCase } from '../../features/activity/domain/useCases/SetDailyLimitNothingUseCase';
import { SyncWidgetUseCase } from '../../features/widgets/domain/useCases/SyncWidgetUseCase';
import { GetCustomCountersUseCase } from '../../features/counters/domain/useCases/GetCustomCountersUseCase';
import { AddCustomCounterUseCase } from '../../features/counters/domain/useCases/AddCustomCounterUseCase';
import { RemoveCustomCounterUseCase } from '../../features/counters/domain/useCases/RemoveCustomCounterUseCase';
import { IncrementCustomCounterUseCase } from '../../features/counters/domain/useCases/IncrementCustomCounterUseCase';
import { ReplaceCustomCountersFromSyncUseCase } from '../../features/counters/domain/useCases/ReplaceCustomCountersFromSyncUseCase';
import { GetCountdownsUseCase } from '../../features/countdowns/domain/useCases/GetCountdownsUseCase';
import { AddCountdownUseCase } from '../../features/countdowns/domain/useCases/AddCountdownUseCase';
import { RemoveCountdownUseCase } from '../../features/countdowns/domain/useCases/RemoveCountdownUseCase';
import { GetTasksForDayUseCase } from '../../features/tasks/domain/useCases/GetTasksForDayUseCase';
import { AddTaskUseCase } from '../../features/tasks/domain/useCases/AddTaskUseCase';
import { ToggleTaskUseCase } from '../../features/tasks/domain/useCases/ToggleTaskUseCase';
import { UpdateTaskUseCase } from '../../features/tasks/domain/useCases/UpdateTaskUseCase';
import { RemoveTaskUseCase } from '../../features/tasks/domain/useCases/RemoveTaskUseCase';
import { TaskCarryoverDismissalUseCase } from '../../features/tasks/domain/useCases/TaskCarryoverDismissalUseCase';
import { MoveTaskUseCase } from '../../features/tasks/domain/useCases/MoveTaskUseCase';
import { MoveTasksUseCase } from '../../features/tasks/domain/useCases/MoveTasksUseCase';
import { GetStoredTasksForDayUseCase } from '../../features/tasks/domain/useCases/GetStoredTasksForDayUseCase';
import { GetDailyTaskStatsUseCase } from '../../features/tasks/domain/useCases/GetDailyTaskStatsUseCase';
import { GetWeeklyTaskStatsUseCase } from '../../features/tasks/domain/useCases/GetWeeklyTaskStatsUseCase';
import { GetMonthlyTaskStatsUseCase } from '../../features/tasks/domain/useCases/GetMonthlyTaskStatsUseCase';
import { ObserveDailyTasksUseCase } from '../../features/tasks/domain/useCases/ObserveDailyTasksUseCase';
import { GetMonthlyGoalsUseCase } from '../../features/tasks/domain/useCases/GetMonthlyGoalsUseCase';
import { GetGoalUseCase } from '../../features/tasks/domain/useCases/GetGoalUseCase';
import { AddMonthlyGoalUseCase } from '../../features/tasks/domain/useCases/AddMonthlyGoalUseCase';
import { UpdateMonthlyGoalUseCase } from '../../features/tasks/domain/useCases/UpdateMonthlyGoalUseCase';
import { RemoveMonthlyGoalUseCase } from '../../features/tasks/domain/useCases/RemoveMonthlyGoalUseCase';
import { AddGoalTaskUseCase } from '../../features/tasks/domain/useCases/AddGoalTaskUseCase';
import { UpdateGoalTaskUseCase } from '../../features/tasks/domain/useCases/UpdateGoalTaskUseCase';
import { RemoveGoalTaskUseCase } from '../../features/tasks/domain/useCases/RemoveGoalTaskUseCase';
import { AddToDailyFromGoalUseCase } from '../../features/tasks/domain/useCases/AddToDailyFromGoalUseCase';
import { SetRepeatDailyFromGoalUseCase } from '../../features/tasks/domain/useCases/SetRepeatDailyFromGoalUseCase';
import { RemoveRepeatDailyFromGoalUseCase } from '../../features/tasks/domain/useCases/RemoveRepeatDailyFromGoalUseCase';
import { IsRepeatDailyUseCase } from '../../features/tasks/domain/useCases/IsRepeatDailyUseCase';
import { CheckForAppUpdateUseCase } from '../../features/app-update/domain/useCases/CheckForAppUpdateUseCase';
import { GetAppVersionUseCase } from '../../features/app-update/domain/useCases/GetAppVersionUseCase';
import { ActivateLicenseUseCase } from '../../features/premium/domain/useCases/ActivateLicenseUseCase';
import { VerifySubscriptionUseCase } from '../../features/premium/domain/useCases/VerifySubscriptionUseCase';
import { GetOnboardingCompletedUseCase } from '../../features/onboarding/domain/useCases/GetOnboardingCompletedUseCase';
import { SetOnboardingCompletedUseCase } from '../../features/onboarding/domain/useCases/SetOnboardingCompletedUseCase';
import { GetOnboardingFunnelStepUseCase } from '../../features/onboarding/domain/useCases/GetOnboardingFunnelStepUseCase';
import { SetOnboardingFunnelStepUseCase } from '../../features/onboarding/domain/useCases/SetOnboardingFunnelStepUseCase';
import { GetOnboardingQuizAnswersUseCase } from '../../features/onboarding/domain/useCases/GetOnboardingQuizAnswersUseCase';
import { PatchOnboardingQuizAnswersUseCase } from '../../features/onboarding/domain/useCases/PatchOnboardingQuizAnswersUseCase';
import { GetOnboardingResultCardsUseCase } from '../../features/onboarding/domain/useCases/GetOnboardingResultCardsUseCase';
import {
  AdvanceOnboardingFunnelUseCase,
  GetOnboardingFunnelEncouragementUseCase,
  GetOnboardingFunnelProgressUseCase,
  RewindOnboardingFunnelUseCase,
} from '../../features/onboarding/domain/useCases/OnboardingFunnelNavigationUseCases';
import { DeviceIdProviderAdapter } from '../../shared/platform/device/DeviceIdProviderAdapter';
import { CompleteAccountSignInUseCase } from '../../features/account/domain/useCases/CompleteAccountSignInUseCase';
import { SignInWithAppleUseCase } from '../../features/account/domain/useCases/SignInWithAppleUseCase';
import { SignInWithGoogleUseCase } from '../../features/account/domain/useCases/SignInWithGoogleUseCase';
import { SignInWithEmailUseCase } from '../../features/account/domain/useCases/SignInWithEmailUseCase';
import { CreateAccountWithEmailUseCase } from '../../features/account/domain/useCases/CreateAccountWithEmailUseCase';
import { SignOutUseCase } from '../../features/account/domain/useCases/SignOutUseCase';
import { DeleteAccountUseCase } from '../../features/account/domain/useCases/DeleteAccountUseCase';
import { SyncAccountProfileUseCase } from '../../features/account/domain/useCases/SyncAccountProfileUseCase';
import { RegisterDeviceUseCase } from '../../features/account/domain/useCases/RegisterDeviceUseCase';
import { RemoveAccountDeviceUseCase } from '../../features/account/domain/useCases/RemoveAccountDeviceUseCase';
import { BindEntitlementToAccountUseCase } from '../../features/account/domain/useCases/BindEntitlementToAccountUseCase';
import { ObserveAuthSessionUseCase } from '../../features/account/domain/useCases/ObserveAuthSessionUseCase';
import { useThemeStore } from '../../shared/theme/themeStore';
import { createWidgetConfigStore } from '../../features/widgets/data/widgetConfigStore';
import { AsyncStorageWidgetConfigRepository } from '../../features/widgets/data/AsyncStorageWidgetConfigRepository';
import { LicenseVerificationServiceAdapter } from '../../features/premium/data/LicenseVerificationServiceAdapter';
import { GetAccessStateUseCase } from '../../features/premium/domain/useCases/GetAccessStateUseCase';
import { GetDailyReflectionUseCase } from '../../features/reflections/domain/useCases/GetDailyReflectionUseCase';
import { VerifyStudentEmailUseCase } from '../../features/premium/domain/useCases/VerifyStudentEmailUseCase';
import { TrackAppOpenUseCase } from '../../features/engagement/domain/useCases/TrackAppOpenUseCase';
import { RunAppOpenSideEffectsUseCase } from '../../features/engagement/domain/useCases/RunAppOpenSideEffectsUseCase';
import { GetEngagementModalStateUseCase } from '../../features/engagement/domain/useCases/GetEngagementModalStateUseCase';
import { SetWidgetCoachPendingUseCase } from '../../features/engagement/domain/useCases/SetWidgetCoachPendingUseCase';
import { ClearWidgetCoachPendingUseCase } from '../../features/engagement/domain/useCases/ClearWidgetCoachPendingUseCase';
import { MaybeRequestInAppReviewUseCase } from '../../features/engagement/domain/useCases/MaybeRequestInAppReviewUseCase';
import { RequestInAppReviewFromSettingsUseCase } from '../../features/engagement/domain/useCases/RequestInAppReviewFromSettingsUseCase';
import { MarkFeatureCoachShownUseCase } from '../../features/engagement/domain/useCases/MarkFeatureCoachShownUseCase';
import { ClearSharePromptPendingUseCase } from '../../features/engagement/domain/useCases/ClearSharePromptPendingUseCase';
import { CheckCountdownCompletionUseCase } from '../../features/countdowns/domain/useCases/CheckCountdownCompletionUseCase';
import { RecordPresenceUseCase } from '../../features/presence/domain/useCases/RecordPresenceUseCase';
import { GetPresenceStreakUseCase } from '../../features/presence/domain/useCases/GetPresenceStreakUseCase';
import { EvaluateBadgesUseCase } from '../../features/badges/domain/useCases/EvaluateBadgesUseCase';
import { GetBadgesUseCase } from '../../features/badges/domain/useCases/GetBadgesUseCase';
import { AcknowledgeBadgesUseCase } from '../../features/badges/domain/useCases/AcknowledgeBadgesUseCase';
import { SyncTrialPreviewUseCase } from '../../features/premium/domain/useCases/SyncTrialPreviewUseCase';
import { TrialPreviewApiAdapter } from '../../features/premium/data/TrialPreviewApiAdapter';
import { TrackLifeScreenViewedUseCase } from '../../features/life/domain/useCases/TrackLifeScreenViewedUseCase';
import { RestorePurchasesUseCase } from '../../features/premium/domain/useCases/RestorePurchasesUseCase';
import { RevenueCatPurchasesRepository } from '../../features/premium/data/RevenueCatPurchasesRepository';
import { RevenueCatPaywallPresenter } from '../../features/premium/data/RevenueCatPaywallPresenter';
import { ConfigurePurchasesUseCase } from '../../features/premium/domain/useCases/ConfigurePurchasesUseCase';
import { SyncCustomerInfoUseCase } from '../../features/premium/domain/useCases/SyncCustomerInfoUseCase';
import { GetOfferingsUseCase } from '../../features/premium/domain/useCases/GetOfferingsUseCase';
import { PurchasePackageUseCase } from '../../features/premium/domain/useCases/PurchasePackageUseCase';
import { IdentifyPurchasesUserUseCase } from '../../features/premium/domain/useCases/IdentifyPurchasesUserUseCase';
import { ResetPurchasesUserUseCase } from '../../features/premium/domain/useCases/ResetPurchasesUserUseCase';
import { PresentRevenueCatPaywallUseCase } from '../../features/premium/domain/useCases/PresentRevenueCatPaywallUseCase';
import { configureWidgetSync, syncPremiumStatus } from '../../features/widgets/data/WidgetSync';
import { logAnalyticsEvent, recordCrashError } from '../../shared/analytics/analytics';
import {
  isKnownUnderMinimumAge,
  markUnderMinimumAge,
} from '../../shared/analytics/analyticsConsent';
import { AssertAccountAgeGateUseCase } from '../../features/account/domain/useCases/AssertAccountAgeGateUseCase';
import { configureRetentionNotifications } from '../../features/engagement/data/retentionNotifications';
import { getTrialDurationDays } from '../../shared/analytics/analyticsUserProperties';

/**
 * Push effective premium to the native widget bridge only. Used when device
 * eligibility changes but the purchase itself did not, so trial reminders stay.
 */
function syncPremiumBridge(): void {
  syncPremiumStatus();
}

function syncPremiumAfterEntitlementChange(): void {
  syncPremiumBridge();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { cancelTrialLocalNotifications } = require('../../features/premium/data/trialReminders');
  void cancelTrialLocalNotifications();
}

const presenceRepository = new MmkvPresenceRepository();
const badgeRepository = new MmkvBadgeRepository();
const timeRepository = new MmkvTimeRepository(presenceRepository);
const subscriptionRepository = new MmkvSubscriptionRepository();
const activityRepository = new MmkvActivityRepository();
const customCounterRepository = new MmkvCustomCounterRepository();
const countdownRepository = new MmkvCountdownRepository();
const taskRepository = new MmkvTaskRepository();
const monthlyGoalRepository = new MmkvMonthlyGoalRepository();
const onboardingRepository = new MmkvOnboardingRepository();
const engagementRepository = new MmkvEngagementRepository();
const widgetConfigRepository = new AsyncStorageWidgetConfigRepository();
const reflectionRepository = new MmkvReflectionRepository();
const studentVerificationRepository = new MmkvStudentVerificationRepository();
export const authSessionRepository = new MmkvAuthSessionRepository();
export const authService = new FirebaseAuthServiceAdapter();
export const accountCloudStore = new FirestoreAccountCloudStoreAdapter();
const appUpdateService = new AppUpdateServiceAdapter();
const appVersionProvider = new AppVersionProviderAdapter();
export const deviceIdProvider = new DeviceIdProviderAdapter();
const licenseVerificationService = new LicenseVerificationServiceAdapter();
const inAppReviewService = new StoreReviewAdapter();
const trialPreviewService = new TrialPreviewApiAdapter();
const clock = new ClockAdapter();
const activityAnalysisService = new ActivityAnalysisAdapter();

export const syncTrialPreviewUseCase = new SyncTrialPreviewUseCase(
  subscriptionRepository,
  deviceIdProvider,
  trialPreviewService,
  syncPremiumAfterEntitlementChange,
  () => {
    void logAnalyticsEvent('trial_preview_started', {
      trial_days: getTrialDurationDays(),
      source: 'in_app_preview',
    });
  }
);

export const observeTimeStateUseCase = new ObserveTimeStateUseCase(timeRepository);
export const updateUserProfileUseCase = new UpdateUserProfileUseCase(
  timeRepository,
  accountCloudStore,
  () => authSessionRepository.getUid()
);
export const observeSubscriptionUseCase = new ObserveSubscriptionUseCase(subscriptionRepository);
export const updateSubscriptionUseCase = new UpdateSubscriptionUseCase(subscriptionRepository);
export const getAccessStateUseCase = new GetAccessStateUseCase(
  subscriptionRepository,
  authSessionRepository
);
export const getDailyReflectionUseCase = new GetDailyReflectionUseCase(
  timeRepository,
  getAccessStateUseCase,
  reflectionRepository,
  onboardingRepository
);
export const assertAccountAgeGateUseCase = new AssertAccountAgeGateUseCase(
  timeRepository,
  { isLockedOut: isKnownUnderMinimumAge, lockOut: markUnderMinimumAge }
);
export const verifyStudentEmailUseCase = new VerifyStudentEmailUseCase(
  studentVerificationRepository,
  assertAccountAgeGateUseCase
);
export const trackAppOpenUseCase = new TrackAppOpenUseCase(
  subscriptionRepository,
  syncTrialPreviewUseCase
);
export const checkCountdownCompletionUseCase = new CheckCountdownCompletionUseCase(
  countdownRepository,
  engagementRepository,
  event => {
    void logAnalyticsEvent('countdown_completed', event);
  }
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
export const recordPresenceUseCase = new RecordPresenceUseCase(presenceRepository);
export const getPresenceStreakUseCase = new GetPresenceStreakUseCase(
  presenceRepository,
);
export const evaluateBadgesUseCase = new EvaluateBadgesUseCase(
  badgeRepository,
  presenceRepository,
  taskRepository,
  countdownRepository,
  monthlyGoalRepository,
  timeRepository,
  subscriptionRepository,
);
export const getBadgesUseCase = new GetBadgesUseCase(
  badgeRepository,
  evaluateBadgesUseCase,
);
export const acknowledgeBadgesUseCase = new AcknowledgeBadgesUseCase(
  badgeRepository,
);
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
export const trackLifeScreenViewedUseCase = new TrackLifeScreenViewedUseCase(subscriptionRepository);

export const purchasesRepository = new RevenueCatPurchasesRepository();
export const paywallPresenter = new RevenueCatPaywallPresenter();
export const syncCustomerInfoUseCase = new SyncCustomerInfoUseCase(
  subscriptionRepository,
  syncPremiumAfterEntitlementChange
);
export const presentRevenueCatPaywallUseCase = new PresentRevenueCatPaywallUseCase(
  paywallPresenter,
  purchasesRepository,
  syncCustomerInfoUseCase
);
export const configurePurchasesUseCase = new ConfigurePurchasesUseCase(
  purchasesRepository
);
export const getOfferingsUseCase = new GetOfferingsUseCase(purchasesRepository);
export const purchasePackageUseCase = new PurchasePackageUseCase(
  purchasesRepository,
  syncCustomerInfoUseCase
);
export const restorePurchasesUseCase = new RestorePurchasesUseCase(
  purchasesRepository,
  syncCustomerInfoUseCase
);
export const identifyPurchasesUserUseCase = new IdentifyPurchasesUserUseCase(
  purchasesRepository,
  syncCustomerInfoUseCase
);
export const resetPurchasesUserUseCase = new ResetPurchasesUserUseCase(
  purchasesRepository,
  syncCustomerInfoUseCase
);

let purchasesConfigured = false;

export function ensurePurchasesConfigured(): { configured: boolean } {
  if (purchasesConfigured) {
    return { configured: true };
  }
  const result = configurePurchasesUseCase.execute();
  if (result.configured) {
    purchasesConfigured = true;
  }
  return result;
}

export const logActivityUseCase = new LogActivityUseCase(
  activityRepository,
  clock
);
export const getCategoryTotalsUseCase = new GetCategoryTotalsUseCase(
  activityRepository,
  clock
);
export const getRegretProjectionUseCase = new GetRegretProjectionUseCase(
  activityRepository,
  timeRepository,
  clock,
  activityAnalysisService
);
export const getInterventionStateUseCase = new GetInterventionStateUseCase(
  activityRepository,
  getAccessStateUseCase,
  clock,
  activityAnalysisService
);
export const getDailyLimitNothingUseCase = new GetDailyLimitNothingUseCase(
  activityRepository
);
export const setDailyLimitNothingUseCase = new SetDailyLimitNothingUseCase(
  activityRepository
);
export const syncWidgetUseCase = new SyncWidgetUseCase(timeRepository);
export const getCustomCountersUseCase = new GetCustomCountersUseCase(customCounterRepository);
export const addCustomCounterUseCase = new AddCustomCounterUseCase(customCounterRepository);
export const removeCustomCounterUseCase = new RemoveCustomCounterUseCase(customCounterRepository);
export const incrementCustomCounterUseCase = new IncrementCustomCounterUseCase(customCounterRepository);
export const replaceCustomCountersFromSyncUseCase = new ReplaceCustomCountersFromSyncUseCase(customCounterRepository);
export const getCountdownsUseCase = new GetCountdownsUseCase(countdownRepository);
export const addCountdownUseCase = new AddCountdownUseCase(
  countdownRepository,
  engagementRepository
);
export const removeCountdownUseCase = new RemoveCountdownUseCase(countdownRepository);
export const getTasksForDayUseCase = new GetTasksForDayUseCase(taskRepository, monthlyGoalRepository);
export const getStoredTasksForDayUseCase = new GetStoredTasksForDayUseCase(taskRepository);
export const addTaskUseCase = new AddTaskUseCase(taskRepository);
export const toggleTaskUseCase = new ToggleTaskUseCase(taskRepository);
export const updateTaskUseCase = new UpdateTaskUseCase(taskRepository);
export const removeTaskUseCase = new RemoveTaskUseCase(taskRepository);
export const taskCarryoverDismissalUseCase = new TaskCarryoverDismissalUseCase(taskRepository);
export const moveTaskUseCase = new MoveTaskUseCase(taskRepository);
export const moveTasksUseCase = new MoveTasksUseCase(taskRepository);
export const getDailyTaskStatsUseCase = new GetDailyTaskStatsUseCase(taskRepository);
export const getWeeklyTaskStatsUseCase = new GetWeeklyTaskStatsUseCase(
  taskRepository,
  getDailyTaskStatsUseCase
);
export const getMonthlyTaskStatsUseCase = new GetMonthlyTaskStatsUseCase(
  taskRepository,
  getDailyTaskStatsUseCase
);
export const observeDailyTasksUseCase = new ObserveDailyTasksUseCase(taskRepository);
export const getMonthlyGoalsUseCase = new GetMonthlyGoalsUseCase(monthlyGoalRepository);
export const getGoalUseCase = new GetGoalUseCase(monthlyGoalRepository);
export const addMonthlyGoalUseCase = new AddMonthlyGoalUseCase(monthlyGoalRepository);
export const updateMonthlyGoalUseCase = new UpdateMonthlyGoalUseCase(monthlyGoalRepository);
export const removeMonthlyGoalUseCase = new RemoveMonthlyGoalUseCase(monthlyGoalRepository);
export const addGoalTaskUseCase = new AddGoalTaskUseCase(monthlyGoalRepository);
export const updateGoalTaskUseCase = new UpdateGoalTaskUseCase(monthlyGoalRepository);
export const removeGoalTaskUseCase = new RemoveGoalTaskUseCase(monthlyGoalRepository);
export const addToDailyFromGoalUseCase = new AddToDailyFromGoalUseCase(taskRepository, monthlyGoalRepository);
export const setRepeatDailyFromGoalUseCase = new SetRepeatDailyFromGoalUseCase(taskRepository, monthlyGoalRepository);
export const removeRepeatDailyFromGoalUseCase = new RemoveRepeatDailyFromGoalUseCase(monthlyGoalRepository);
export const isRepeatDailyUseCase = new IsRepeatDailyUseCase(monthlyGoalRepository);
export const checkForAppUpdateUseCase = new CheckForAppUpdateUseCase(appUpdateService);
export const getAppVersionUseCase = new GetAppVersionUseCase(appVersionProvider);
export const activateLicenseUseCase = new ActivateLicenseUseCase(
  subscriptionRepository,
  deviceIdProvider,
  licenseVerificationService
);
export const verifySubscriptionUseCase = new VerifySubscriptionUseCase(
  subscriptionRepository,
  deviceIdProvider,
  licenseVerificationService
);
export const getOnboardingCompletedUseCase = new GetOnboardingCompletedUseCase(onboardingRepository);
export const setOnboardingCompletedUseCase = new SetOnboardingCompletedUseCase(onboardingRepository);
export const getOnboardingFunnelStepUseCase = new GetOnboardingFunnelStepUseCase(
  onboardingRepository
);
export const setOnboardingFunnelStepUseCase = new SetOnboardingFunnelStepUseCase(
  onboardingRepository
);
export const getOnboardingQuizAnswersUseCase = new GetOnboardingQuizAnswersUseCase(
  onboardingRepository
);
export const patchOnboardingQuizAnswersUseCase =
  new PatchOnboardingQuizAnswersUseCase(onboardingRepository);
export const getOnboardingResultCardsUseCase = new GetOnboardingResultCardsUseCase(
  onboardingRepository
);
export const advanceOnboardingFunnelUseCase = new AdvanceOnboardingFunnelUseCase(
  onboardingRepository
);
export const rewindOnboardingFunnelUseCase = new RewindOnboardingFunnelUseCase(
  onboardingRepository
);
export const getOnboardingFunnelProgressUseCase =
  new GetOnboardingFunnelProgressUseCase(onboardingRepository);
export const getOnboardingFunnelEncouragementUseCase =
  new GetOnboardingFunnelEncouragementUseCase(onboardingRepository);

/**
 * Account use cases. Wired last because they reuse the purchase use cases above
 * to re-check local entitlement proof before writing it to the account.
 */

const accountPlatform = (): 'ios' | 'android' =>
  Platform.OS === 'ios' ? 'ios' : 'android';

/** Best-effort human label for the device list (e.g. "Pixel 7"). */
function currentDeviceLabel(): string | null {
  try {
    const DeviceInfo = require('react-native-device-info').default;
    const model = DeviceInfo?.getModel?.();
    return typeof model === 'string' && model ? model : null;
  } catch {
    return null;
  }
}

export const observeAuthSessionUseCase = new ObserveAuthSessionUseCase(
  authSessionRepository
);

export const syncAccountProfileUseCase = new SyncAccountProfileUseCase(
  timeRepository,
  accountCloudStore,
  {
    get: () => useThemeStore.getState().themeMode,
    set: value => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        void useThemeStore.getState().setThemeMode(value);
      }
    },
  }
);

export const registerDeviceUseCase = new RegisterDeviceUseCase(
  accountCloudStore,
  deviceIdProvider,
  accountPlatform,
  currentDeviceLabel,
  recordCrashError
);

export const bindEntitlementToAccountUseCase = new BindEntitlementToAccountUseCase(
  subscriptionRepository,
  authSessionRepository,
  accountCloudStore,
  accountPlatform,
  {
    restorePurchases: restorePurchasesUseCase,
    verifySubscription: verifySubscriptionUseCase,
  },
  syncPremiumAfterEntitlementChange,
  recordCrashError
);

export const completeAccountSignInUseCase = new CompleteAccountSignInUseCase(
  authSessionRepository,
  syncAccountProfileUseCase,
  registerDeviceUseCase,
  bindEntitlementToAccountUseCase,
  identifyPurchasesUserUseCase,
  accountCloudStore,
  recordCrashError,
  syncPremiumBridge
);

export const signInWithAppleUseCase = new SignInWithAppleUseCase(
  authService,
  completeAccountSignInUseCase,
  assertAccountAgeGateUseCase
);

export const signInWithGoogleUseCase = new SignInWithGoogleUseCase(
  authService,
  completeAccountSignInUseCase,
  assertAccountAgeGateUseCase
);

export const signInWithEmailUseCase = new SignInWithEmailUseCase(
  authService,
  completeAccountSignInUseCase,
  assertAccountAgeGateUseCase
);

export const createAccountWithEmailUseCase = new CreateAccountWithEmailUseCase(
  authService,
  completeAccountSignInUseCase,
  assertAccountAgeGateUseCase
);

export const signOutUseCase = new SignOutUseCase(
  authService,
  authSessionRepository,
  subscriptionRepository,
  resetPurchasesUserUseCase,
  recordCrashError,
  syncPremiumAfterEntitlementChange
);

export const deleteAccountUseCase = new DeleteAccountUseCase(
  authService,
  accountCloudStore,
  resetPurchasesUserUseCase,
  signOutUseCase,
  recordCrashError
);

export const removeAccountDeviceUseCase = new RemoveAccountDeviceUseCase(
  accountCloudStore,
  authSessionRepository,
  deviceIdProvider,
  registerDeviceUseCase,
  bindEntitlementToAccountUseCase,
  syncPremiumBridge
);

configureWidgetSync({
  syncWidgetUseCase,
  getCustomCountersUseCase,
  getCountdownsUseCase,
  getDailyTaskStatsUseCase,
  getAccessStateUseCase,
});

configureRetentionNotifications({
  getBirthDate: () => timeRepository.getUserProfile().birthDate,
  getTrialStartDate: () => subscriptionRepository.getTrialStartDate(),
});

export const useWidgetConfigStore = createWidgetConfigStore(widgetConfigRepository);
