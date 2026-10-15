/**
 * Pure public API of the account feature, for the domain and data layers of other
 * features. Nothing here may import React, native modules or app/di, so importing it never loads
 * screens or hooks. Add an export deliberately when another feature's domain needs it.
 */

export { isAgeGateError } from './ageGateErrors';
export type { AgeGateFailure } from './ageGateErrors';
export type { IAuthSessionRepository } from './ports/IAuthSessionRepository';
export type {
  AgeConfirmation,
  AssertAccountAgeGateUseCase,
} from './useCases/AssertAccountAgeGateUseCase';
