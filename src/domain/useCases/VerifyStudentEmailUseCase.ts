import type { IStudentVerificationRepository } from '../repository/IStudentVerificationRepository';
import {
  isEligibleStudentEmail,
  normalizeStudentEmail,
} from '../../core/monetization/studentEmail';

export class VerifyStudentEmailUseCase {
  constructor(private readonly repository: IStudentVerificationRepository) {}

  isVerified(): boolean {
    return this.repository.getVerifiedEmail() != null;
  }

  getVerifiedEmail(): string | null {
    return this.repository.getVerifiedEmail();
  }

  /** Returns true when email is eligible and persisted. */
  verify(email: string): { ok: true } | { ok: false; reason: 'invalid' } {
    const normalized = normalizeStudentEmail(email);
    if (!isEligibleStudentEmail(normalized)) {
      return { ok: false, reason: 'invalid' };
    }
    this.repository.setVerified(normalized, Date.now());
    return { ok: true };
  }
}
