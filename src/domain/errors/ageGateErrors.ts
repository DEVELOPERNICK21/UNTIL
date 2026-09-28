import { MINIMUM_ACCOUNT_AGE_YEARS } from '../../core/legal/ageGate';

export type AgeGateFailure = 'confirmation_required' | 'under_minimum_age';

export class AgeGateError extends Error {
  constructor(readonly reason: AgeGateFailure) {
    super(
      reason === 'under_minimum_age'
        ? `You need to be ${MINIMUM_ACCOUNT_AGE_YEARS} or older to create an account. You can keep using UNTIL on this device without one.`
        : `Confirm you are ${MINIMUM_ACCOUNT_AGE_YEARS} or older to continue.`
    );
    this.name = 'AgeGateError';
  }
}

export function isAgeGateError(error: unknown): error is AgeGateError {
  return error instanceof AgeGateError;
}
