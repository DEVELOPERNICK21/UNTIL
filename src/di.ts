/**
 * Composition root - wires infrastructure to domain
 * Single place where repository implementations are instantiated and injected into use cases.
 */

import { MmkvTimeRepository } from './infrastructure/repositories/MmkvTimeRepository';
import { MmkvSubscriptionRepository } from './infrastructure/repositories/MmkvSubscriptionRepository';
import { MmkvActivityRepository } from './infrastructure/repositories/MmkvActivityRepository';
import { MmkvCustomCounterRepository } from './infrastructure/repositories/MmkvCustomCounterRepository';
import { MmkvCountdownRepository } from './infrastructure/repositories/MmkvCountdownRepository';
import { MmkvTaskRepository } from './infrastructure/repositories/MmkvTaskRepository';
import { MmkvMonthlyGoalRepository } from './infrastructure/repositories/MmkvMonthlyGoalRepository';
import { MmkvOnboardingRepository } from './infrastructure/repositories/MmkvOnboardingRepository';
import { AppUpdateServiceAdapter } from './infrastructure/adapters/AppUpdateServiceAdapter';
import { AppVersionProviderAdapter } from './infrastructure/adapters/AppVersionProviderAdapter';
import { ObserveTimeStateUseCase } from './domain/useCases/ObserveTimeStateUseCase';
import { UpdateUserProfileUseCase } from './domain/useCases/UpdateUserProfileUseCase';
import { ObserveSubscriptionUseCase } from './domain/useCases/ObserveSubscriptionUseCase';
import { UpdateSubscriptionUseCase } from './domain/useCases/UpdateSubscriptionUseCase';
import { LogActivityUseCase } from './domain/useCases/LogActivityUseCase';
import { GetCategoryTotalsUseCase } from './domain/useCases/GetCategoryTotalsUseCase';
import { GetRegretProjectionUseCase } from './domain/useCases/GetRegretProjectionUseCase';
import { GetInterventionStateUseCase } from './domain/useCases/GetInterventionStateUseCase';
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
import { DeviceIdProviderAdapter } from './infrastructure/adapters/DeviceIdProviderAdapter';
import { LicenseVerificationServiceAdapter } from './infrastructure/adapters/LicenseVerificationServiceAdapter';

const timeRepository = new MmkvTimeRepository();
const subscriptionRepository = new MmkvSubscriptionRepository();
const activityRepository = new MmkvActivityRepository();
const customCounterRepository = new MmkvCustomCounterRepository();
const countdownRepository = new MmkvCountdownRepository();
const taskRepository = new MmkvTaskRepository();
const monthlyGoalRepository = new MmkvMonthlyGoalRepository();
const onboardingRepository = new MmkvOnboardingRepository();
const appUpdateService = new AppUpdateServiceAdapter();
const appVersionProvider = new AppVersionProviderAdapter();
const deviceIdProvider = new DeviceIdProviderAdapter();
const licenseVerificationService = new LicenseVerificationServiceAdapter();

export const observeTimeStateUseCase = new ObserveTimeStateUseCase(timeRepository);
export const updateUserProfileUseCase = new UpdateUserProfileUseCase(timeRepository);
export const observeSubscriptionUseCase = new ObserveSubscriptionUseCase(subscriptionRepository);
export const updateSubscriptionUseCase = new UpdateSubscriptionUseCase(subscriptionRepository);
export const logActivityUseCase = new LogActivityUseCase(activityRepository);
export const getCategoryTotalsUseCase = new GetCategoryTotalsUseCase(activityRepository);
export const getRegretProjectionUseCase = new GetRegretProjectionUseCase(activityRepository, timeRepository);
export const getInterventionStateUseCase = new GetInterventionStateUseCase(activityRepository, subscriptionRepository);
export const syncWidgetUseCase = new SyncWidgetUseCase(timeRepository);
export const getCustomCountersUseCase = new GetCustomCountersUseCase(customCounterRepository);
export const addCustomCounterUseCase = new AddCustomCounterUseCase(customCounterRepository);
export const removeCustomCounterUseCase = new RemoveCustomCounterUseCase(customCounterRepository);
export const incrementCustomCounterUseCase = new IncrementCustomCounterUseCase(customCounterRepository);
export const replaceCustomCountersFromSyncUseCase = new ReplaceCustomCountersFromSyncUseCase(customCounterRepository);
export const getCountdownsUseCase = new GetCountdownsUseCase(countdownRepository);
export const addCountdownUseCase = new AddCountdownUseCase(countdownRepository);
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
