/**
 * Activity feature: logging, regret projection, intervention.
 */

import { LogActivityUseCase } from '../../features/activity/domain/useCases/LogActivityUseCase';
import { GetCategoryTotalsUseCase } from '../../features/activity/domain/useCases/GetCategoryTotalsUseCase';
import { GetRegretProjectionUseCase } from '../../features/activity/domain/useCases/GetRegretProjectionUseCase';
import { GetInterventionStateUseCase } from '../../features/activity/domain/useCases/GetInterventionStateUseCase';
import { GetDailyLimitNothingUseCase } from '../../features/activity/domain/useCases/GetDailyLimitNothingUseCase';
import { SetDailyLimitNothingUseCase } from '../../features/activity/domain/useCases/SetDailyLimitNothingUseCase';
import {
  activityAnalysisService,
  activityRepository,
  clock,
  timeRepository,
} from './repositories';
import { getAccessStateUseCase } from './premium';

export const logActivityUseCase = new LogActivityUseCase(
  activityRepository,
  clock
);

export const getCategoryTotalsUseCase = new GetCategoryTotalsUseCase(
  activityRepository,
  clock
);

export const getRegretProjectionUseCase = new GetRegretProjectionUseCase(
  activityRepository,
  timeRepository,
  clock,
  activityAnalysisService
);

export const getInterventionStateUseCase = new GetInterventionStateUseCase(
  activityRepository,
  getAccessStateUseCase,
  clock,
  activityAnalysisService
);

export const getDailyLimitNothingUseCase = new GetDailyLimitNothingUseCase(
  activityRepository
);

export const setDailyLimitNothingUseCase = new SetDailyLimitNothingUseCase(
  activityRepository
);
