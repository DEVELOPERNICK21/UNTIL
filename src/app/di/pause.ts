/**
 * Pause feature: calm minutes, levels and milestones, kept on this phone.
 */

import { GetPauseProgressUseCase } from '../../features/pause/domain/useCases/GetPauseProgressUseCase';
import { GetPauseGlanceUseCase } from '../../features/pause/domain/useCases/GetPauseGlanceUseCase';
import { RecordPauseSessionUseCase } from '../../features/pause/domain/useCases/RecordPauseSessionUseCase';
import { pauseProgressRepository } from './repositories';

export const getPauseProgressUseCase = new GetPauseProgressUseCase(pauseProgressRepository);

export const recordPauseSessionUseCase = new RecordPauseSessionUseCase(pauseProgressRepository);

export const getPauseGlanceUseCase = new GetPauseGlanceUseCase(pauseProgressRepository);
