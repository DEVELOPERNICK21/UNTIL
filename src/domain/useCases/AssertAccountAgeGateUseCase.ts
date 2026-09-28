/**
 * AssertAccountAgeGateUseCase — runs before any provider call that can create
 * an account or collect an email. Throws AgeGateError so nothing is sent to
 * Firebase Auth (or stored) when the gate fails.
 */

import type { ITimeRepository } from '../repository/ITimeRepository';
import { evaluateAccountAgeGate } from '../../core/legal/ageGate';
import { AgeGateError } from '../errors/ageGateErrors';

export interface AgeConfirmation {
  confirmedMinimumAge: boolean;
}

/** Persistent under-13 marker so editing the birth date afterwards does not reopen the gate. */
export interface MinimumAgeLockout {
  isLockedOut(): boolean;
  lockOut(): void;
}

export class AssertAccountAgeGateUseCase {
  constructor(
    private readonly timeRepository: Pick<ITimeRepository, 'getUserProfile'>,
    private readonly lockout: MinimumAgeLockout,
    private readonly now: () => Date = () => new Date()
  ) {}

  execute(confirmation: AgeConfirmation): void {
    if (this.lockout.isLockedOut()) {
      throw new AgeGateError('under_minimum_age');
    }
    const result = evaluateAccountAgeGate({
      birthDate: this.timeRepository.getUserProfile().birthDate,
      confirmedMinimumAge: confirmation.confirmedMinimumAge === true,
      now: this.now(),
    });
    if (result === 'allowed') return;
    if (result === 'under_minimum_age') this.lockout.lockOut();
    throw new AgeGateError(result);
  }

  /** For flows that record a birth date: locks out without throwing. */
  observeBirthDate(birthDate: string | null): void {
    const result = evaluateAccountAgeGate({
      birthDate,
      confirmedMinimumAge: true,
      now: this.now(),
    });
    if (result === 'under_minimum_age') this.lockout.lockOut();
  }
}
