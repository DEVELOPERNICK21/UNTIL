/**
 * SyncAccountProfileUseCase — merge the local profile (DOB, death age, theme)
 * with the account's cloud profile after sign-in.
 */

import type { IAccountCloudStore } from '../ports/IAccountCloudStore';
import type { ITimeRepository } from '../repository/ITimeRepository';
import type { ProfileSyncResult } from '../../types';

/** Local theme before the user picks one in Settings; also the store default. */
export const DEFAULT_LOCAL_THEME = 'system';

/**
 * Theme access as plain callbacks so this use case stays out of the store layer.
 */
export interface ThemePreferenceGateway {
  get(): string | null;
  set(value: string): void;
}

export class SyncAccountProfileUseCase {
  constructor(
    private readonly timeRepository: ITimeRepository,
    private readonly cloud: IAccountCloudStore,
    private readonly theme?: ThemePreferenceGateway
  ) {}

  async execute(uid: string): Promise<ProfileSyncResult> {
    const local = this.timeRepository.getUserProfile();
    const cloudProfile = await this.cloud.getProfile(uid);
    const cloudBirthDate = cloudProfile?.birthDate ?? null;

    let appliedFromCloud = false;
    let pushedToCloud = false;

    if (!local.birthDate && cloudBirthDate) {
      this.timeRepository.setUserProfile(
        cloudBirthDate,
        cloudProfile?.deathAge ?? local.deathAge
      );
      appliedFromCloud = true;
    } else if (local.birthDate && local.birthDate !== cloudBirthDate) {
      /**
       * Local wins on conflict. The cloud doc carries updatedAt but the local
       * profile has no timestamp to compare it against, and this sync runs on
       * the first bind after onboarding, where local holds the DOB the user
       * just entered.
       */
      await this.cloud.upsertProfile(uid, {
        birthDate: local.birthDate,
        deathAge: local.deathAge,
      });
      pushedToCloud = true;
    } else if (local.birthDate && cloudProfile?.deathAge !== local.deathAge) {
      await this.cloud.upsertProfile(uid, { deathAge: local.deathAge });
      pushedToCloud = true;
    }

    if (this.theme) {
      const localTheme = this.theme.get();
      const cloudTheme = cloudProfile?.theme ?? null;
      const localIsUnset =
        localTheme == null || localTheme === DEFAULT_LOCAL_THEME;

      if (localIsUnset && cloudTheme) {
        this.theme.set(cloudTheme);
        appliedFromCloud = true;
      } else if (
        localTheme &&
        localTheme !== cloudTheme &&
        localTheme !== DEFAULT_LOCAL_THEME
      ) {
        await this.cloud.upsertProfile(uid, { theme: localTheme });
        pushedToCloud = true;
      }
    }

    return { appliedFromCloud, pushedToCloud };
  }
}
