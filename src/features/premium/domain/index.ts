/**
 * Pure public API of the premium feature, for the domain and data layers of other
 * features. Nothing here may import React, native modules or app/di, so importing it never loads
 * screens or hooks. Add an export deliberately when another feature's domain needs it.
 */

export { hasPremiumBundle } from './accessControl';
export type { ISubscriptionRepository } from './ports/ISubscriptionRepository';
export { getTrialDayIndex } from './trialDay';
export type { GetAccessStateUseCase } from './useCases/GetAccessStateUseCase';
export type {
  SyncTrialPreviewUseCase,
} from './useCases/SyncTrialPreviewUseCase';
