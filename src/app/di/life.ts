/**
 * Life feature.
 */

import { TrackLifeScreenViewedUseCase } from '../../features/life/domain/useCases/TrackLifeScreenViewedUseCase';
import { subscriptionRepository } from './repositories';

export const trackLifeScreenViewedUseCase = new TrackLifeScreenViewedUseCase(subscriptionRepository);
