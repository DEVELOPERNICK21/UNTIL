/**
 * useLogActivity - Returns functions to start/stop activity tracking
 */

import { useCallback } from 'react';
import { logActivityUseCase } from '../../../app/di';
import type { ActivityCategory } from '../../../shared/types';

export function useLogActivity() {
  const startCategory = useCallback((category: ActivityCategory) => {
    logActivityUseCase.startCategory(category);
  }, []);

  const endCurrent = useCallback(() => {
    logActivityUseCase.endCurrentBlock();
  }, []);

  const addPastBlock = useCallback(
    (category: ActivityCategory, durationMinutes: number) => {
      logActivityUseCase.addPastBlock(category, durationMinutes);
    },
    []
  );

  return { startCategory, endCurrent, addPastBlock };
}
