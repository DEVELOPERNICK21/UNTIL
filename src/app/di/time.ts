/**
 * Time feature: the day/month/year/life state and the person profile.
 */

import { ObserveTimeStateUseCase } from '../../features/time/domain/useCases/ObserveTimeStateUseCase';
import { UpdateUserProfileUseCase } from '../../features/time/domain/useCases/UpdateUserProfileUseCase';
import {
  accountCloudStore,
  authSessionRepository,
  timeRepository,
} from './repositories';

export const observeTimeStateUseCase = new ObserveTimeStateUseCase(timeRepository);

export const updateUserProfileUseCase = new UpdateUserProfileUseCase(
  timeRepository,
  accountCloudStore,
  () => authSessionRepository.getUid()
);
