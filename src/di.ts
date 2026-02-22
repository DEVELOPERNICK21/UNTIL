/**
 * Composition root - wires infrastructure to domain
 * Single place where repository implementations are instantiated and injected into use cases.
 */

import { MmkvTimeRepository } from './infrastructure/repositories/MmkvTimeRepository';
import { MmkvSubscriptionRepository } from './infrastructure/repositories/MmkvSubscriptionRepository';
import { MmkvActivityRepository } from './infrastructure/repositories/MmkvActivityRepository';
import { MmkvCustomCounterRepository } from './infrastructure/repositories/MmkvCustomCounterRepository';
import { MmkvCountdownRepository } from './infrastructure/repositories/MmkvCountdownRepository';
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
import { GetCountdownsUseCase } from './domain/useCases/GetCountdownsUseCase';
import { AddCountdownUseCase } from './domain/useCases/AddCountdownUseCase';
import { RemoveCountdownUseCase } from './domain/useCases/RemoveCountdownUseCase';

const timeRepository = new MmkvTimeRepository();
const subscriptionRepository = new MmkvSubscriptionRepository();
const activityRepository = new MmkvActivityRepository();
const customCounterRepository = new MmkvCustomCounterRepository();
const countdownRepository = new MmkvCountdownRepository();

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
export const getCountdownsUseCase = new GetCountdownsUseCase(countdownRepository);
export const addCountdownUseCase = new AddCountdownUseCase(countdownRepository);
export const removeCountdownUseCase = new RemoveCountdownUseCase(countdownRepository);
