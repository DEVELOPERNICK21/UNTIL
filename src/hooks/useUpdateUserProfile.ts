/**
 * useUpdateUserProfile - Returns function to update user profile via TimeRepository.
 * After update, tells the widgets to rebuild their cache (platform/widgetSync port).
 */

import { useCallback } from 'react';
import { assertAccountAgeGateUseCase, updateUserProfileUseCase } from '../di';
import { widgetSync } from '../platform/widgetSync';

export function useUpdateUserProfile() {
  const updateUserProfile = useCallback(
    (birthDate: string, deathAge: number) => {
      updateUserProfileUseCase.execute(birthDate, deathAge);
      assertAccountAgeGateUseCase.observeBirthDate(birthDate);
      widgetSync.syncWidgetCache();
    },
    []
  );
  return updateUserProfile;
}
