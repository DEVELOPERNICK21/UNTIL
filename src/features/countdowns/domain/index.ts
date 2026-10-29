/**
 * Pure public API of the countdowns feature, for the domain and data layers of other
 * features. Nothing here may import React, native modules or app/di, so importing it never loads
 * screens or hooks. Add an export deliberately when another feature's domain needs it.
 */

export { getSignedDaysUntil } from './daysLeft';export type { ICountdownRepository } from './ports/ICountdownRepository';
export type {
  CheckCountdownCompletionUseCase,
} from './useCases/CheckCountdownCompletionUseCase';
export type { GetCountdownsUseCase } from './useCases/GetCountdownsUseCase';
