/**
 * Countdowns feature.
 */

import { CheckCountdownCompletionUseCase } from '../../features/countdowns/domain/useCases/CheckCountdownCompletionUseCase';
import { logAnalyticsEvent } from '../../shared/analytics/analytics';
import { GetCountdownsUseCase } from '../../features/countdowns/domain/useCases/GetCountdownsUseCase';
import { AddCountdownUseCase } from '../../features/countdowns/domain/useCases/AddCountdownUseCase';
import { RemoveCountdownUseCase } from '../../features/countdowns/domain/useCases/RemoveCountdownUseCase';
import { countdownRepository, engagementRepository } from './repositories';

export const checkCountdownCompletionUseCase = new CheckCountdownCompletionUseCase(
  countdownRepository,
  engagementRepository,
  event => {
    void logAnalyticsEvent('countdown_completed', event);
  }
);

export const getCountdownsUseCase = new GetCountdownsUseCase(countdownRepository);

export const addCountdownUseCase = new AddCountdownUseCase(
  countdownRepository,
  engagementRepository
);

export const removeCountdownUseCase = new RemoveCountdownUseCase(countdownRepository);
