/**
 * Account age gate, built early because both premium (student email) and account (sign-in) use it.
 */

import { AssertAccountAgeGateUseCase } from '../../features/account/domain/useCases/AssertAccountAgeGateUseCase';
import {
  isKnownUnderMinimumAge,
  markUnderMinimumAge,
} from '../../shared/analytics/analyticsConsent';
import { timeRepository } from './repositories';

export const assertAccountAgeGateUseCase = new AssertAccountAgeGateUseCase(
  timeRepository,
  { isLockedOut: isKnownUnderMinimumAge, lockOut: markUnderMinimumAge }
);
