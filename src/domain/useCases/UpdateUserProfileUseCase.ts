/**
 * UpdateUserProfileUseCase - Updates user profile via TimeRepository, and when the person is signed
 * in, pushes the change to their account so their other devices (the Mac and Windows app) see it
 * straight away instead of at the next launch.
 */

import type { ITimeRepository } from '../repository/TimeRepository';
import type { IProfileCloudSync } from '../ports/IProfileCloudSync';

export class UpdateUserProfileUseCase {
  constructor(
    private readonly repository: ITimeRepository,
    private readonly cloud?: IProfileCloudSync,
    private readonly getUid: () => string | null = () => null
  ) {}

  execute(birthDate: string, deathAge: number): void {
    this.repository.setUserProfile(birthDate, deathAge);

    const uid = this.getUid();
    if (!uid || !this.cloud) return;
    // Not awaited: the phone must not wait on the network. If this fails, the next launch pushes
    // the same values again (SyncAccountProfileUseCase keeps the local profile on a mismatch).
    this.cloud.upsertProfile(uid, { birthDate, deathAge }).catch(() => {});
  }
}
