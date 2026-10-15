/**
 * Repositories and adapters: the concrete implementations every section below wires into use cases.
 */

import { MmkvPresenceRepository } from '../../features/presence/data/MmkvPresenceRepository';
import { MmkvBadgeRepository } from '../../features/badges/data/MmkvBadgeRepository';
import { MmkvTimeRepository } from '../../features/time/data/MmkvTimeRepository';
import { MmkvSubscriptionRepository } from '../../features/premium/data/MmkvSubscriptionRepository';
import { MmkvActivityRepository } from '../../features/activity/data/MmkvActivityRepository';
import { MmkvCustomCounterRepository } from '../../features/counters/data/MmkvCustomCounterRepository';
import { MmkvCountdownRepository } from '../../features/countdowns/data/MmkvCountdownRepository';
import { MmkvTaskRepository } from '../../features/tasks/data/MmkvTaskRepository';
import { MmkvMonthlyGoalRepository } from '../../features/tasks/data/MmkvMonthlyGoalRepository';
import { MmkvOnboardingRepository } from '../../features/onboarding/data/MmkvOnboardingRepository';
import { MmkvEngagementRepository } from '../../features/engagement/data/MmkvEngagementRepository';
import { AsyncStorageWidgetConfigRepository } from '../../features/widgets/data/AsyncStorageWidgetConfigRepository';
import { MmkvReflectionRepository } from '../../features/reflections/data/MmkvReflectionRepository';
import { MmkvStudentVerificationRepository } from '../../features/premium/data/MmkvStudentVerificationRepository';
import { MmkvAuthSessionRepository } from '../../features/account/data/MmkvAuthSessionRepository';
import { FirebaseAuthServiceAdapter } from '../../features/account/data/FirebaseAuthServiceAdapter';
import { FirestoreAccountCloudStoreAdapter } from '../../features/account/data/FirestoreAccountCloudStoreAdapter';
import { AppUpdateServiceAdapter } from '../../features/app-update/data/AppUpdateServiceAdapter';
import { AppVersionProviderAdapter } from '../../features/app-update/data/AppVersionProviderAdapter';
import { DeviceIdProviderAdapter } from '../../shared/platform/device/DeviceIdProviderAdapter';
import { LicenseVerificationServiceAdapter } from '../../features/premium/data/LicenseVerificationServiceAdapter';
import { StoreReviewAdapter } from '../../features/engagement/data/StoreReviewAdapter';
import { TrialPreviewApiAdapter } from '../../features/premium/data/TrialPreviewApiAdapter';
import { ClockAdapter } from '../../shared/time/ClockAdapter';
import { ActivityAnalysisAdapter } from '../../features/activity/data/ActivityAnalysisAdapter';
import { RevenueCatPurchasesRepository } from '../../features/premium/data/RevenueCatPurchasesRepository';
import { RevenueCatPaywallPresenter } from '../../features/premium/data/RevenueCatPaywallPresenter';

export const presenceRepository = new MmkvPresenceRepository();

export const badgeRepository = new MmkvBadgeRepository();

export const timeRepository = new MmkvTimeRepository(presenceRepository);

export const subscriptionRepository = new MmkvSubscriptionRepository();

export const activityRepository = new MmkvActivityRepository();

export const customCounterRepository = new MmkvCustomCounterRepository();

export const countdownRepository = new MmkvCountdownRepository();

export const taskRepository = new MmkvTaskRepository();

export const monthlyGoalRepository = new MmkvMonthlyGoalRepository();

export const onboardingRepository = new MmkvOnboardingRepository();

export const engagementRepository = new MmkvEngagementRepository();

export const widgetConfigRepository = new AsyncStorageWidgetConfigRepository();

export const reflectionRepository = new MmkvReflectionRepository();

export const studentVerificationRepository = new MmkvStudentVerificationRepository();

export const authSessionRepository = new MmkvAuthSessionRepository();

export const authService = new FirebaseAuthServiceAdapter();

export const accountCloudStore = new FirestoreAccountCloudStoreAdapter();

export const appUpdateService = new AppUpdateServiceAdapter();

export const appVersionProvider = new AppVersionProviderAdapter();

export const deviceIdProvider = new DeviceIdProviderAdapter();

export const licenseVerificationService = new LicenseVerificationServiceAdapter();

export const inAppReviewService = new StoreReviewAdapter();

export const trialPreviewService = new TrialPreviewApiAdapter();

export const clock = new ClockAdapter();

export const activityAnalysisService = new ActivityAnalysisAdapter();

export const purchasesRepository = new RevenueCatPurchasesRepository();

export const paywallPresenter = new RevenueCatPaywallPresenter();
