/**
 * useUpdateUserProfile - Returns function to update user profile via TimeRepository.
 * After update, syncs widget cache (WidgetSync is allowed in hooks per architecture).
 */

import { useCallback } from 'react';
import { updateUserProfileUseCase } from '../di';
import { syncWidgetCache } from '../infrastructure';

export function useUpdateUserProfile() {
  const updateUserProfile = useCallback(
    (birthDate: string, deathAge: number) => {
      updateUserProfileUseCase.execute(birthDate, deathAge);
      syncWidgetCache();
    },
    []
  );
  return updateUserProfile;
}
