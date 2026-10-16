/**
 * Onboarding feature: funnel state and quiz answers.
 */

import { GetOnboardingCompletedUseCase } from '../../features/onboarding/domain/useCases/GetOnboardingCompletedUseCase';
import { SetOnboardingCompletedUseCase } from '../../features/onboarding/domain/useCases/SetOnboardingCompletedUseCase';
import { GetOnboardingFunnelStepUseCase } from '../../features/onboarding/domain/useCases/GetOnboardingFunnelStepUseCase';
import { SetOnboardingFunnelStepUseCase } from '../../features/onboarding/domain/useCases/SetOnboardingFunnelStepUseCase';
import { GetOnboardingQuizAnswersUseCase } from '../../features/onboarding/domain/useCases/GetOnboardingQuizAnswersUseCase';
import { PatchOnboardingQuizAnswersUseCase } from '../../features/onboarding/domain/useCases/PatchOnboardingQuizAnswersUseCase';
import { GetOnboardingResultCardsUseCase } from '../../features/onboarding/domain/useCases/GetOnboardingResultCardsUseCase';
import {
  AdvanceOnboardingFunnelUseCase,
  RewindOnboardingFunnelUseCase,
  GetOnboardingFunnelProgressUseCase,
  GetOnboardingFunnelEncouragementUseCase,
} from '../../features/onboarding/domain/useCases/OnboardingFunnelNavigationUseCases';
import { onboardingRepository } from './repositories';

export const getOnboardingCompletedUseCase = new GetOnboardingCompletedUseCase(onboardingRepository);

export const setOnboardingCompletedUseCase = new SetOnboardingCompletedUseCase(onboardingRepository);

export const getOnboardingFunnelStepUseCase = new GetOnboardingFunnelStepUseCase(
  onboardingRepository
);

export const setOnboardingFunnelStepUseCase = new SetOnboardingFunnelStepUseCase(
  onboardingRepository
);

export const getOnboardingQuizAnswersUseCase = new GetOnboardingQuizAnswersUseCase(
  onboardingRepository
);

export const patchOnboardingQuizAnswersUseCase =
  new PatchOnboardingQuizAnswersUseCase(onboardingRepository);

export const getOnboardingResultCardsUseCase = new GetOnboardingResultCardsUseCase(
  onboardingRepository
);

export const advanceOnboardingFunnelUseCase = new AdvanceOnboardingFunnelUseCase(
  onboardingRepository
);

export const rewindOnboardingFunnelUseCase = new RewindOnboardingFunnelUseCase(
  onboardingRepository
);

export const getOnboardingFunnelProgressUseCase =
  new GetOnboardingFunnelProgressUseCase(onboardingRepository);

export const getOnboardingFunnelEncouragementUseCase =
  new GetOnboardingFunnelEncouragementUseCase(onboardingRepository);
