/**
 * Composition root - wires infrastructure to domain
 * Single place where repository implementations are instantiated and injected into use cases.
 */

import { Platform } from 'react-native';
import { MmkvTimeRepository } from './infrastructure/repositories/MmkvTimeRepository';
import { MmkvSubscriptionRepository } from './infrastructure/repositories/MmkvSubscriptionRepository';
import { MmkvActivityRepository } from './infrastructure/repositories/MmkvActivityRepository';
import { MmkvCustomCounterRepository } from './infrastructure/repositories/MmkvCustomCounterRepository';
import { MmkvCountdownRepository } from './infrastructure/repositories/MmkvCountdownRepository';
import { MmkvTaskRepository } from './infrastructure/repositories/MmkvTaskRepository';
import { MmkvMonthlyGoalRepository } from './infrastructure/repositories/MmkvMonthlyGoalRepository';
import { MmkvOnboardingRepository } from './infrastructure/repositories/MmkvOnboardingRepository';
import { MmkvEngagementRepository } from './infrastructure/repositories/MmkvEngagementRepository';
import { MmkvPresenceRepository } from './infrastructure/repositories/MmkvPresenceRepository';
import { MmkvReflectionRepository } from './infrastructure/repositories/MmkvReflectionRepository';
import { MmkvStudentVerificationRepository } from './infrastructure/repositories/MmkvStudentVerificationRepository';
import { MmkvAuthSessionRepository } from './infrastructure/repositories/MmkvAuthSessionRepository';
import { FirebaseAuthServiceAdapter } from './infrastructure/adapters/FirebaseAuthServiceAdapter';
import { FirestoreAccountCloudStoreAdapter } from './infrastructure/adapters/FirestoreAccountCloudStoreAdapter';
import { AppUpdateServiceAdapter } from './infrastructure/adapters/AppUpdateServiceAdapter';
import { AppVersionProviderAdapter } from './infrastructure/adapters/AppVersionProviderAdapter';
import { ActivityAnalysisAdapter } from './infrastructure/adapters/ActivityAnalysisAdapter';
import { ClockAdapter } from './infrastructure/adapters/ClockAdapter';
import { StoreReviewAdapter } from './infrastructure/adapters/StoreReviewAdapter';
import { ObserveTimeStateUseCase } from './domain/useCases/ObserveTimeStateUseCase';
import { UpdateUserProfileUseCase } from './domain/useCases/UpdateUserProfileUseCase';
import { ObserveSubscriptionUseCase } from './domain/useCases/ObserveSubscriptionUseCase';
import { UpdateSubscriptionUseCase } from './domain/useCases/UpdateSubscriptionUseCase';
import { LogActivityUseCase } from './domain/useCases/LogActivityUseCase';
import { GetCategoryTotalsUseCase } from './domain/useCases/GetCategoryTotalsUseCase';
import { GetRegretProjectionUseCase } from './domain/useCases/GetRegretProjectionUseCase';
import { GetInterventionStateUseCase } from './domain/useCases/GetInterventionStateUseCase';
import { GetDailyLimitNothingUseCase } from './domain/useCases/GetDailyLimitNothingUseCase';
import { SetDailyLimitNothingUseCase } from './domain/useCases/SetDailyLimitNothingUseCase';
import { SyncWidgetUseCase } from './domain/useCases/SyncWidgetUseCase';
import { GetCustomCountersUseCase } from './domain/useCases/GetCustomCountersUseCase';
import { AddCustomCounterUseCase } from './domain/useCases/AddCustomCounterUseCase';
import { RemoveCustomCounterUseCase } from './domain/useCases/RemoveCustomCounterUseCase';
import { IncrementCustomCounterUseCase } from './domain/useCases/IncrementCustomCounterUseCase';
import { ReplaceCustomCountersFromSyncUseCase } from './domain/useCases/ReplaceCustomCountersFromSyncUseCase';
import { GetCountdownsUseCase } from './domain/useCases/GetCountdownsUseCase';
import { AddCountdownUseCase } from './domain/useCases/AddCountdownUseCase';
import { RemoveCountdownUseCase } from './domain/useCases/RemoveCountdownUseCase';
import { GetTasksForDayUseCase } from './domain/useCases/GetTasksForDayUseCase';
import { AddTaskUseCase } from './domain/useCases/AddTaskUseCase';
import { ToggleTaskUseCase } from './domain/useCases/ToggleTaskUseCase';
import { UpdateTaskUseCase } from './domain/useCases/UpdateTaskUseCase';
import { RemoveTaskUseCase } from './domain/useCases/RemoveTaskUseCase';
import { GetDailyTaskStatsUseCase } from './domain/useCases/GetDailyTaskStatsUseCase';
import { GetWeeklyTaskStatsUseCase } from './domain/useCases/GetWeeklyTaskStatsUseCase';
import { GetMonthlyTaskStatsUseCase } from './domain/useCases/GetMonthlyTaskStatsUseCase';
import { ObserveDailyTasksUseCase } from './domain/useCases/ObserveDailyTasksUseCase';
import { GetMonthlyGoalsUseCase } from './domain/useCases/GetMonthlyGoalsUseCase';
import { GetGoalUseCase } from './domain/useCases/GetGoalUseCase';
import { AddMonthlyGoalUseCase } from './domain/useCases/AddMonthlyGoalUseCase';
import { UpdateMonthlyGoalUseCase } from './domain/useCases/UpdateMonthlyGoalUseCase';
import { RemoveMonthlyGoalUseCase } from './domain/useCases/RemoveMonthlyGoalUseCase';
import { AddGoalTaskUseCase } from './domain/useCases/AddGoalTaskUseCase';
import { UpdateGoalTaskUseCase } from './domain/useCases/UpdateGoalTaskUseCase';
import { RemoveGoalTaskUseCase } from './domain/useCases/RemoveGoalTaskUseCase';
import { AddToDailyFromGoalUseCase } from './domain/useCases/AddToDailyFromGoalUseCase';
import { SetRepeatDailyFromGoalUseCase } from './domain/useCases/SetRepeatDailyFromGoalUseCase';
import { RemoveRepeatDailyFromGoalUseCase } from './domain/useCases/RemoveRepeatDailyFromGoalUseCase';
import { IsRepeatDailyUseCase } from './domain/useCases/IsRepeatDailyUseCase';
import { CheckForAppUpdateUseCase } from './domain/useCases/CheckForAppUpdateUseCase';
import { GetAppVersionUseCase } from './domain/useCases/GetAppVersionUseCase';
import { ActivateLicenseUseCase } from './domain/useCases/ActivateLicenseUseCase';
import { VerifySubscriptionUseCase } from './domain/useCases/VerifySubscriptionUseCase';
import { GetOnboardingCompletedUseCase } from './domain/useCases/GetOnboardingCompletedUseCase';
import { SetOnboardingCompletedUseCase } from './domain/useCases/SetOnboardingCompletedUseCase';
import { GetOnboardingFunnelStepUseCase } from './domain/useCases/GetOnboardingFunnelStepUseCase';
import { SetOnboardingFunnelStepUseCase } from './domain/useCases/SetOnboardingFunnelStepUseCase';
import { GetOnboardingQuizAnswersUseCase } from './domain/useCases/GetOnboardingQuizAnswersUseCase';
import { PatchOnboardingQuizAnswersUseCase } from './domain/useCases/PatchOnboardingQuizAnswersUseCase';
import { GetOnboardingResultCardsUseCase } from './domain/useCases/GetOnboardingResultCardsUseCase';
import {
  AdvanceOnboardingFunnelUseCase,
  GetOnboardingFunnelEncouragementUseCase,
  GetOnboardingFunnelProgressUseCase,
  RewindOnboardingFunnelUseCase,
} from './domain/useCases/OnboardingFunnelNavigationUseCases';
import { DeviceIdProviderAdapter } from './infrastructure/adapters/DeviceIdProviderAdapter';
import { SignInWithGoogleUseCase } from './domain/useCases/SignInWithGoogleUseCase';
import { SignOutUseCase } from './domain/useCases/SignOutUseCase';
import { SyncAccountProfileUseCase } from './domain/useCases/SyncAccountProfileUseCase';
import { RegisterDeviceUseCase } from './domain/useCases/RegisterDeviceUseCase';
import { RemoveAccountDeviceUseCase } from './domain/useCases/RemoveAccountDeviceUseCase';
import { BindEntitlementToAccountUseCase } from './domain/useCases/BindEntitlementToAccountUseCase';
import { ObserveAuthSessionUseCase } from './domain/useCases/ObserveAuthSessionUseCase';
import { useThemeStore } from './stores/themeStore';
import { LicenseVerificationServiceAdapter } from './infrastructure/adapters/LicenseVerificationServiceAdapter';
import { GetAccessStateUseCase } from './domain/useCases/GetAccessStateUseCase';
import { GetDailyReflectionUseCase } from './domain/useCases/GetDailyReflectionUseCase';
import { VerifyStudentEmailUseCase } from './domain/useCases/VerifyStudentEmailUseCase';
import { TrackAppOpenUseCase } from './domain/useCases/TrackAppOpenUseCase';
import { RunAppOpenSideEffectsUseCase } from './domain/useCases/RunAppOpenSideEffectsUseCase';
import { GetEngagementModalStateUseCase } from './domain/useCases/GetEngagementModalStateUseCase';
import { SetWidgetCoachPendingUseCase } from './domain/useCases/SetWidgetCoachPendingUseCase';
import { ClearWidgetCoachPendingUseCase } from './domain/useCases/ClearWidgetCoachPendingUseCase';
import { MaybeRequestInAppReviewUseCase } from './domain/useCases/MaybeRequestInAppReviewUseCase';
import { RequestInAppReviewFromSettingsUseCase } from './domain/useCases/RequestInAppReviewFromSettingsUseCase';
import { MarkFeatureCoachShownUseCase } from './domain/useCases/MarkFeatureCoachShownUseCase';
import { ClearSharePromptPendingUseCase } from './domain/useCases/ClearSharePromptPendingUseCase';
import { CheckCountdownCompletionUseCase } from './domain/useCases/CheckCountdownCompletionUseCase';
import { RecordPresenceUseCase } from './domain/useCases/RecordPresenceUseCase';
import { GetPresenceStreakUseCase } from './domain/useCases/GetPresenceStreakUseCase';
import { SyncTrialPreviewUseCase } from './domain/useCases/SyncTrialPreviewUseCase';
import { TrialPreviewApiAdapter } from './infrastructure/adapters/TrialPreviewApiAdapter';
import { TrackLifeScreenViewedUseCase } from './domain/useCases/TrackLifeScreenViewedUseCase';
import { ApplyStorePurchaseUseCase } from './domain/useCases/ApplyStorePurchaseUseCase';
import { PlayPurchaseVerificationServiceAdapter } from './infrastructure/adapters/PlayPurchaseVerificationServiceAdapter';
import { RestorePurchasesUseCase } from './domain/useCases/RestorePurchasesUseCase';
import { ReconcilePlayEntitlementUseCase } from './domain/useCases/ReconcilePlayEntitlementUseCase';
import { PlayBillingRepository } from './infrastructure/repositories/PlayBillingRepository';
import { NoOpPlayBillingRepository } from './infrastructure/repositories/NoOpPlayBillingRepository';
import type { IPlayBillingRepository } from './domain/repository/IPlayBillingRepository';
import { productIdToPurchaseType } from './domain/billing/mapProductId';
import { logAnalyticsEvent, recordCrashError } from './services/analytics';
import { getTrialDurationDays } from './services/analyticsUserProperties';
import {
  clearPendingPurchase,
  consumePendingPurchase,
  notifyPurchaseSuccess,
} from './services/purchaseAnalyticsContext';

/**
 * Push effective premium to the native widget bridge only. Used when device
 * eligibility changes but the purchase itself did not, so trial reminders stay.
 * Avoids a top-level import of WidgetSync (circular with this file).
 */
function syncPremiumBridge(): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { syncPremiumStatus } = require('./infrastructure/WidgetSync');
  syncPremiumStatus();
}

function syncPremiumAfterEntitlementChange(): void {
  syncPremiumBridge();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { cancelTrialLocalNotifications } = require('./services/trialReminders');
  void cancelTrialLocalNotifications();
}

const timeRepository = new MmkvTimeRepository();
const subscriptionRepository = new MmkvSubscriptionRepository();
const activityRepository = new MmkvActivityRepository();
const customCounterRepository = new MmkvCustomCounterRepository();
const countdownRepository = new MmkvCountdownRepository();
const taskRepository = new MmkvTaskRepository();
const monthlyGoalRepository = new MmkvMonthlyGoalRepository();
const onboardingRepository = new MmkvOnboardingRepository();
const engagementRepository = new MmkvEngagementRepository();
const presenceRepository = new MmkvPresenceRepository();
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
const playPurchaseVerificationService = new PlayPurchaseVerificationServiceAdapter();
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
export const updateUserProfileUseCase = new UpdateUserProfileUseCase(timeRepository);
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
export const verifyStudentEmailUseCase = new VerifyStudentEmailUseCase(
  studentVerificationRepository
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
export const applyStorePurchaseUseCase = new ApplyStorePurchaseUseCase(
  subscriptionRepository,
  playPurchaseVerificationService,
  syncPremiumAfterEntitlementChange
);

let playBillingAndroid: PlayBillingRepository | undefined;

function logPurchaseFailed(
  planId: string,
  errorCode: string,
  errorMessage: string,
  pending?: ReturnType<typeof consumePendingPurchase>
): void {
  const ctx = pending === undefined ? consumePendingPurchase() : pending;
  void logAnalyticsEvent('premium_purchase_failed', {
    plan_id: planId || ctx?.plan_id || 'unknown',
    source: ctx?.source ?? 'unknown',
    price_display: ctx?.price_display ?? '',
    error_code: errorCode,
    error_message: errorMessage,
    payment_provider: 'google_play',
  });
  clearPendingPurchase();
}

export const playBillingRepository: IPlayBillingRepository =
  Platform.OS === 'android'
    ? (() => {
        let instance: PlayBillingRepository;
        instance = new PlayBillingRepository(
          async purchase => {
            if (purchase.purchaseState === 'pending') {
              return;
            }
            if (!productIdToPurchaseType(purchase.productId)) {
              return;
            }
            const wasTrialActive = getAccessStateUseCase.execute().trialActive;
            const pending = consumePendingPurchase();
            const result = await applyStorePurchaseUseCase.execute({
              productId: purchase.productId,
              purchaseToken: purchase.purchaseToken ?? null,
              transactionDate: purchase.transactionDate,
            });
            if (!result.applied) {
              logPurchaseFailed(
                purchase.productId,
                'verification_failed',
                result.error ?? 'Purchase verification failed',
                pending
              );
              return;
            }
            void logAnalyticsEvent('premium_purchase_completed', {
              plan_id: purchase.productId,
              source: pending?.source ?? 'unknown',
              price_display: pending?.price_display ?? '',
              payment_provider: 'google_play',
            });
            if (wasTrialActive) {
              void logAnalyticsEvent('trial_preview_ended', {
                converted: 1,
                plan_id: purchase.productId,
              });
            }
            notifyPurchaseSuccess();
            await instance.finalizePurchase(purchase);
          },
          (message, code) => {
            const pending = consumePendingPurchase();
            logPurchaseFailed(
              pending?.plan_id ?? 'unknown',
              code ?? 'unknown',
              message,
              pending
            );
          }
        );
        playBillingAndroid = instance;
        return instance;
      })()
    : new NoOpPlayBillingRepository();

export const restorePurchasesUseCase = new RestorePurchasesUseCase(
  subscriptionRepository,
  playBillingRepository,
  syncPremiumAfterEntitlementChange
);

export const reconcilePlayEntitlementUseCase = new ReconcilePlayEntitlementUseCase(
  subscriptionRepository,
  restorePurchasesUseCase,
  syncPremiumAfterEntitlementChange
);

export async function ensurePlayBillingSession(): Promise<void> {
  if (Platform.OS !== 'android' || !playBillingAndroid) return;
  await playBillingAndroid.initConnection();
  playBillingAndroid.attachPurchaseListeners();
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
export const addTaskUseCase = new AddTaskUseCase(taskRepository);
export const toggleTaskUseCase = new ToggleTaskUseCase(taskRepository);
export const updateTaskUseCase = new UpdateTaskUseCase(taskRepository);
export const removeTaskUseCase = new RemoveTaskUseCase(taskRepository);
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

export const signInWithGoogleUseCase = new SignInWithGoogleUseCase(
  authService,
  authSessionRepository,
  syncAccountProfileUseCase,
  registerDeviceUseCase,
  bindEntitlementToAccountUseCase,
  recordCrashError,
  syncPremiumBridge
);

export const signOutUseCase = new SignOutUseCase(
  authService,
  authSessionRepository,
  subscriptionRepository,
  syncPremiumAfterEntitlementChange
);

export const removeAccountDeviceUseCase = new RemoveAccountDeviceUseCase(
  accountCloudStore,
  authSessionRepository,
  deviceIdProvider,
  registerDeviceUseCase,
  bindEntitlementToAccountUseCase,
  syncPremiumBridge
);
