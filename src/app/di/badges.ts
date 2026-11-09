/**
 * Badges feature.
 */

import { EvaluateBadgesUseCase } from '../../features/badges/domain/useCases/EvaluateBadgesUseCase';
import { GetBadgesUseCase } from '../../features/badges/domain/useCases/GetBadgesUseCase';
import { AcknowledgeBadgesUseCase } from '../../features/badges/domain/useCases/AcknowledgeBadgesUseCase';
import {
  badgeRepository,
  countdownRepository,
  monthlyGoalRepository,
  planRecordStore,
  presenceRepository,
  subscriptionRepository,
  taskRepository,
  timeRepository,
} from './repositories';

export const evaluateBadgesUseCase = new EvaluateBadgesUseCase(
  badgeRepository,
  presenceRepository,
  taskRepository,
  countdownRepository,
  monthlyGoalRepository,
  timeRepository,
  subscriptionRepository,
  planRecordStore,
);

export const getBadgesUseCase = new GetBadgesUseCase(
  badgeRepository,
  evaluateBadgesUseCase,
);

export const acknowledgeBadgesUseCase = new AcknowledgeBadgesUseCase(
  badgeRepository,
);
