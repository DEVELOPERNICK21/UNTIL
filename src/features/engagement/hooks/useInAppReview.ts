import { useCallback } from 'react';
import { requestInAppReviewFromSettingsUseCase } from '../../../app/di';

export function useInAppReview() {
  const rateApp = useCallback(() => {
    void requestInAppReviewFromSettingsUseCase.execute();
  }, []);

  return { rateApp };
}
