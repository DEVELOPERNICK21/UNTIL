/**
 * useUpdateUserProfile - Returns function to update user profile via TimeRepository
 */

import { useCallback } from 'react';
import { updateUserProfileUseCase } from '../di';

export function useUpdateUserProfile() {
  const updateUserProfile = useCallback(
    (birthDate: string, deathAge: number) => {
      updateUserProfileUseCase.execute(birthDate, deathAge);
    },
    []
  );
  return updateUserProfile;
}
