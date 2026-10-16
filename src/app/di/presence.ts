/**
 * Presence feature: the daily "you showed up" streak.
 */

import { RecordPresenceUseCase } from '../../features/presence/domain/useCases/RecordPresenceUseCase';
import { GetPresenceStreakUseCase } from '../../features/presence/domain/useCases/GetPresenceStreakUseCase';
import { presenceRepository } from './repositories';

export const recordPresenceUseCase = new RecordPresenceUseCase(presenceRepository);

export const getPresenceStreakUseCase = new GetPresenceStreakUseCase(
  presenceRepository,
);
