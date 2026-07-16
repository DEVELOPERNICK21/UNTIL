/**
 * useOnboardingFunnel — step, answers, progress, and navigation for quiz funnel.
 */

import { useCallback, useState } from 'react';
import {
  advanceOnboardingFunnelUseCase,
  getOnboardingFunnelEncouragementUseCase,
  getOnboardingFunnelProgressUseCase,
  getOnboardingFunnelStepUseCase,
  getOnboardingQuizAnswersUseCase,
  getOnboardingResultCardsUseCase,
  patchOnboardingQuizAnswersUseCase,
  rewindOnboardingFunnelUseCase,
  setOnboardingFunnelStepUseCase,
} from '../di';
import type {
  OnboardingFunnelStep,
  OnboardingQuizAnswers,
} from '../types';
import type { OnboardingResultCard } from '../domain/useCases/GetOnboardingResultCardsUseCase';

export function useOnboardingFunnel() {
  const [step, setStepState] = useState<OnboardingFunnelStep>(() =>
    getOnboardingFunnelStepUseCase.execute()
  );
  const [answers, setAnswersState] = useState<OnboardingQuizAnswers>(() =>
    getOnboardingQuizAnswersUseCase.execute()
  );
  const [progress, setProgress] = useState(() =>
    getOnboardingFunnelProgressUseCase.execute()
  );
  const [encouragement, setEncouragement] = useState<string | null>(() =>
    getOnboardingFunnelEncouragementUseCase.execute()
  );
  const [resultCards, setResultCards] = useState<OnboardingResultCard[]>(() =>
    getOnboardingResultCardsUseCase.execute()
  );

  const sync = useCallback(() => {
    setStepState(getOnboardingFunnelStepUseCase.execute());
    setAnswersState(getOnboardingQuizAnswersUseCase.execute());
    setProgress(getOnboardingFunnelProgressUseCase.execute());
    setEncouragement(getOnboardingFunnelEncouragementUseCase.execute());
    setResultCards(getOnboardingResultCardsUseCase.execute());
  }, []);

  const setStep = useCallback(
    (next: OnboardingFunnelStep) => {
      setOnboardingFunnelStepUseCase.execute(next);
      sync();
    },
    [sync]
  );

  const advance = useCallback(() => {
    advanceOnboardingFunnelUseCase.execute();
    sync();
  }, [sync]);

  const goBack = useCallback(() => {
    rewindOnboardingFunnelUseCase.execute();
    sync();
  }, [sync]);

  const patchAnswers = useCallback(
    (patch: Partial<OnboardingQuizAnswers>) => {
      patchOnboardingQuizAnswersUseCase.execute(patch);
      sync();
    },
    [sync]
  );

  return {
    step,
    answers,
    progress,
    encouragement,
    resultCards,
    setStep,
    advance,
    goBack,
    patchAnswers,
    sync,
  };
}
