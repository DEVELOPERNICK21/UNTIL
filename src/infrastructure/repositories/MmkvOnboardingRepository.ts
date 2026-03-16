/**
 * MMKV-backed implementation of IOnboardingRepository.
 */

import type { IOnboardingRepository } from '../../domain/repository/IOnboardingRepository';
import { STORAGE_KEYS } from '../../persistence/schema';
import { getBoolean, setBoolean } from '../../persistence/mmkv';

export class MmkvOnboardingRepository implements IOnboardingRepository {
  getCompleted(): boolean {
    return getBoolean(STORAGE_KEYS.ONBOARDING_COMPLETED) ?? false;
  }

  setCompleted(value: boolean): void {
    setBoolean(STORAGE_KEYS.ONBOARDING_COMPLETED, value);
  }
}
