/**
 * Records Life screen visits for 24h event unlock (engagement conversion).
 */

import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { trackLifeScreenViewedUseCase } from '../di';

export function useTrackLifeScreenVisit(): void {
  useFocusEffect(
    useCallback(() => {
      trackLifeScreenViewedUseCase.execute();
    }, [])
  );
}
