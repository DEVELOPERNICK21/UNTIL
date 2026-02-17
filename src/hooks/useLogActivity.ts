/**
 * useLogActivity - Returns functions to start/stop activity tracking
 */

import { useCallback } from 'react';
import { logActivityUseCase } from '../di';
import type { ActivityCategory } from '../types';

export function useLogActivity() {
  const startCategory = useCallback((category: ActivityCategory) => {
    logActivityUseCase.startCategory(category);
  }, []);

  const endCurrent = useCallback(() => {
    logActivityUseCase.endCurrentBlock();
  }, []);

  return { startCategory, endCurrent };
}
