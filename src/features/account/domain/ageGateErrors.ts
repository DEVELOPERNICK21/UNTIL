import { t } from '../../../shared/i18n/translate';
import { MINIMUM_ACCOUNT_AGE_YEARS } from './ageGate';

export type AgeGateFailure = 'confirmation_required' | 'under_minimum_age';

export class AgeGateError extends Error {
  constructor(readonly reason: AgeGateFailure) {
    super(
      reason === 'under_minimum_age'
        ? t('account.error.underAge', { age: MINIMUM_ACCOUNT_AGE_YEARS })
        : t('account.error.ageRequired', { age: MINIMUM_ACCOUNT_AGE_YEARS })
    );
    this.name = 'AgeGateError';
  }
}

export function isAgeGateError(error: unknown): error is AgeGateError {
  return error instanceof AgeGateError;
}
