import type { IStudentVerificationRepository } from '../repository/IStudentVerificationRepository';
import {
  isEligibleStudentEmail,
  normalizeStudentEmail,
} from '../../core/monetization/studentEmail';
import { isAgeGateError, type AgeGateFailure } from '../errors/ageGateErrors';
import type {
  AgeConfirmation,
  AssertAccountAgeGateUseCase,
} from './AssertAccountAgeGateUseCase';

export type StudentVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | AgeGateFailure };

export class VerifyStudentEmailUseCase {
  constructor(
    private readonly repository: IStudentVerificationRepository,
    private readonly ageGate: AssertAccountAgeGateUseCase
  ) {}

  isVerified(): boolean {
    return this.repository.getVerifiedEmail() != null;
  }

  getVerifiedEmail(): string | null {
    return this.repository.getVerifiedEmail();
  }

  /** Age gate runs before the email is validated or persisted. */
  verify(email: string, confirmation: AgeConfirmation): StudentVerifyResult {
    try {
      this.ageGate.execute(confirmation);
    } catch (e) {
      if (isAgeGateError(e)) return { ok: false, reason: e.reason };
      throw e;
    }
    const normalized = normalizeStudentEmail(email);
    if (!isEligibleStudentEmail(normalized)) {
      return { ok: false, reason: 'invalid' };
    }
    this.repository.setVerified(normalized, Date.now());
    return { ok: true };
  }
}
