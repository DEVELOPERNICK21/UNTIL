/**
 * MMKV-backed implementation of IOnboardingRepository.
 */

import type { IOnboardingRepository } from '../../domain/repository/IOnboardingRepository';
import type {
  OnboardingFunnelStep,
  OnboardingQuizAnswers,
} from '../../types';
import { isValidFunnelStep } from '../../core/onboarding';
import { STORAGE_KEYS } from '../../persistence/schema';
import {
  getBoolean,
  getString,
  setBoolean,
  setString,
} from '../../persistence/mmkv';

const DEFAULT_STEP: OnboardingFunnelStep = 'brand';

function parseAnswers(raw: string | undefined): OnboardingQuizAnswers {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as OnboardingQuizAnswers;
  } catch {
    return {};
  }
}

export class MmkvOnboardingRepository implements IOnboardingRepository {
  getCompleted(): boolean {
    return getBoolean(STORAGE_KEYS.ONBOARDING_COMPLETED) ?? false;
  }

  setCompleted(value: boolean): void {
    setBoolean(STORAGE_KEYS.ONBOARDING_COMPLETED, value);
  }

  getFunnelStep(): OnboardingFunnelStep {
    const raw = getString(STORAGE_KEYS.ONBOARDING_FUNNEL_STEP);
    if (raw && isValidFunnelStep(raw)) return raw;
    return DEFAULT_STEP;
  }

  setFunnelStep(step: OnboardingFunnelStep): void {
    setString(STORAGE_KEYS.ONBOARDING_FUNNEL_STEP, step);
  }

  getQuizAnswers(): OnboardingQuizAnswers {
    return parseAnswers(getString(STORAGE_KEYS.ONBOARDING_QUIZ_ANSWERS));
  }

  setQuizAnswers(answers: OnboardingQuizAnswers): void {
    setString(STORAGE_KEYS.ONBOARDING_QUIZ_ANSWERS, JSON.stringify(answers));
  }

  patchQuizAnswers(
    patch: Partial<OnboardingQuizAnswers>
  ): OnboardingQuizAnswers {
    const next = { ...this.getQuizAnswers(), ...patch };
    this.setQuizAnswers(next);
    return next;
  }
}
