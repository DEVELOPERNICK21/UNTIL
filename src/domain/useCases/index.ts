/**
 * Use case classes - exported for composition root (di.ts) and testing.
 * Instances are created in src/di.ts and consumed via hooks.
 */

export { ObserveTimeStateUseCase } from './ObserveTimeStateUseCase';
export { UpdateUserProfileUseCase } from './UpdateUserProfileUseCase';
export { ObserveSubscriptionUseCase } from './ObserveSubscriptionUseCase';
export { UpdateSubscriptionUseCase } from './UpdateSubscriptionUseCase';
export { LogActivityUseCase } from './LogActivityUseCase';
export { GetCategoryTotalsUseCase } from './GetCategoryTotalsUseCase';
export { GetRegretProjectionUseCase } from './GetRegretProjectionUseCase';
export { GetInterventionStateUseCase } from './GetInterventionStateUseCase';
export { SyncWidgetUseCase } from './SyncWidgetUseCase';

export type { UserProfileState, TimeStateResult } from './ObserveTimeStateUseCase';
