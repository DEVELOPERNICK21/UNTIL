/**
 * Composition root - wires infrastructure to domain
 * Single place where repository implementations are instantiated and injected into use cases.
 */

import { MmkvTimeRepository } from './infrastructure/repositories/MmkvTimeRepository';
import { MmkvSubscriptionRepository } from './infrastructure/repositories/MmkvSubscriptionRepository';
import { MmkvActivityRepository } from './infrastructure/repositories/MmkvActivityRepository';
import { ObserveTimeStateUseCase } from './domain/useCases/ObserveTimeStateUseCase';
import { UpdateUserProfileUseCase } from './domain/useCases/UpdateUserProfileUseCase';
import { ObserveSubscriptionUseCase } from './domain/useCases/ObserveSubscriptionUseCase';
import { UpdateSubscriptionUseCase } from './domain/useCases/UpdateSubscriptionUseCase';
import { LogActivityUseCase } from './domain/useCases/LogActivityUseCase';
import { GetCategoryTotalsUseCase } from './domain/useCases/GetCategoryTotalsUseCase';
import { GetRegretProjectionUseCase } from './domain/useCases/GetRegretProjectionUseCase';
import { GetInterventionStateUseCase } from './domain/useCases/GetInterventionStateUseCase';

const timeRepository = new MmkvTimeRepository();
const subscriptionRepository = new MmkvSubscriptionRepository();
const activityRepository = new MmkvActivityRepository();

export const observeTimeStateUseCase = new ObserveTimeStateUseCase(timeRepository);
export const updateUserProfileUseCase = new UpdateUserProfileUseCase(timeRepository);
export const observeSubscriptionUseCase = new ObserveSubscriptionUseCase(subscriptionRepository);
export const updateSubscriptionUseCase = new UpdateSubscriptionUseCase(subscriptionRepository);
export const logActivityUseCase = new LogActivityUseCase(activityRepository);
export const getCategoryTotalsUseCase = new GetCategoryTotalsUseCase(activityRepository);
export const getRegretProjectionUseCase = new GetRegretProjectionUseCase(activityRepository, timeRepository);
export const getInterventionStateUseCase = new GetInterventionStateUseCase(activityRepository, subscriptionRepository);
