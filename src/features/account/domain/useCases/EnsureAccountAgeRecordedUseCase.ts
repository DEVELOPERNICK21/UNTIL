/**
 * EnsureAccountAgeRecordedUseCase — make sure the cloud account carries the 13+ flag the Firestore
 * rules demand before they accept any profile, device or entitlement write.
 *
 * Accounts that signed in before the age gate shipped never got the flag, so on every launch their
 * profile sync and device registration were refused (permission-denied) and cloud sync never
 * worked for them. A birth date that proves the person is 13 or older is stronger evidence than a
 * tick box, so when we already hold one we record the flag. With no birth date, or an under-13 one,
 * nothing is written: the account stays blocked until the person confirms their age at sign-in.
 */

import type { IAccountCloudStore } from '../ports/IAccountCloudStore';
import type { ITimeRepository } from '../../../time/domain';
import { ageInWholeYears, MINIMUM_ACCOUNT_AGE_YEARS } from '../ageGate';
import type { MinimumAgeLockout } from './AssertAccountAgeGateUseCase';
import { now as clockNow } from '../../../../shared/time/clock';

export type AgeRecordResult =
  | 'already_recorded'
  | 'recorded'
  | 'needs_confirmation'
  | 'under_minimum_age';

export class EnsureAccountAgeRecordedUseCase {
  constructor(
    private readonly cloud: Pick<IAccountCloudStore, 'getProfile' | 'upsertProfile'>,
    private readonly timeRepository: Pick<ITimeRepository, 'getUserProfile'>,
    private readonly lockout: Pick<MinimumAgeLockout, 'isLockedOut'>,
    private readonly now: () => Date = clockNow
  ) {}

  async execute(uid: string): Promise<AgeRecordResult> {
    if (this.lockout.isLockedOut()) return 'under_minimum_age';

    const profile = await this.cloud.getProfile(uid);
    if (profile?.minimumAgeConfirmed === true) return 'already_recorded';

    const birthDate = this.timeRepository.getUserProfile().birthDate;
    const age = birthDate ? ageInWholeYears(birthDate, this.now()) : null;
    if (age == null) return 'needs_confirmation';
    if (age < MINIMUM_ACCOUNT_AGE_YEARS) return 'under_minimum_age';

    await this.cloud.upsertProfile(uid, {
      minimumAgeConfirmed: true,
      minimumAgeConfirmedAt: this.now().getTime(),
    });
    return 'recorded';
  }
}
