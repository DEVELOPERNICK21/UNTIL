/**
 * Reflections feature.
 */

import { GetDailyReflectionUseCase } from '../../features/reflections/domain/useCases/GetDailyReflectionUseCase';
import {
  onboardingRepository,
  reflectionRepository,
  timeRepository,
} from './repositories';
import { getAccessStateUseCase } from './premium';

export const getDailyReflectionUseCase = new GetDailyReflectionUseCase(
  timeRepository,
  getAccessStateUseCase,
  reflectionRepository,
  onboardingRepository
);
