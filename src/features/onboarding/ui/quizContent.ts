/**
 * Onboarding quiz question copy (UI layer).
 * Functions, not constants, so the text follows the language that is active when a screen renders.
 */

import type {
  OnboardingCadence,
  OnboardingDrain,
  OnboardingGoal,
  OnboardingReadiness,
  OnboardingValues,
} from '../../../shared/types';
import { t } from '../../../shared/i18n/translate';

export interface QuizOption<T extends string> {
  value: T;
  label: string;
}

export function getGoalOptions(): QuizOption<OnboardingGoal>[] {
  return [
    { value: 'people', label: t('onboarding.goal.people') },
    { value: 'focus', label: t('onboarding.goal.focus') },
    { value: 'health', label: t('onboarding.goal.health') },
    { value: 'calm', label: t('onboarding.goal.calm') },
    { value: 'other', label: t('onboarding.goal.other') },
  ];
}

export function getDrainOptions(): QuizOption<OnboardingDrain>[] {
  return [
    { value: 'social', label: t('onboarding.drain.social') },
    { value: 'work', label: t('onboarding.drain.work') },
    { value: 'busywork', label: t('onboarding.drain.busywork') },
    { value: 'priorities', label: t('onboarding.drain.priorities') },
    { value: 'unsure', label: t('onboarding.drain.unsure') },
  ];
}

export function getValuesOptions(): QuizOption<OnboardingValues>[] {
  return [
    { value: 'people', label: t('onboarding.values.people') },
    { value: 'focus', label: t('onboarding.values.focus') },
    { value: 'health', label: t('onboarding.values.health') },
    { value: 'calm', label: t('onboarding.values.calm') },
    { value: 'rest', label: t('onboarding.values.rest') },
    { value: 'other', label: t('onboarding.values.other') },
  ];
}

export function getCadenceOptions(): QuizOption<OnboardingCadence>[] {
  return [
    { value: 'checkins', label: t('onboarding.cadence.checkins') },
    { value: 'widgets', label: t('onboarding.cadence.widgets') },
    { value: 'both', label: t('onboarding.cadence.both') },
    { value: 'unsure', label: t('onboarding.cadence.unsure') },
  ];
}

export function getReadinessOptions(): QuizOption<OnboardingReadiness>[] {
  return [
    { value: 'ready', label: t('onboarding.readiness.ready') },
    { value: 'gentle', label: t('onboarding.readiness.gentle') },
    { value: 'exploring', label: t('onboarding.readiness.exploring') },
  ];
}

export function getQuizPrompts() {
  return {
    q_goal: t('onboarding.prompt.goal'),
    q_drain: t('onboarding.prompt.drain'),
    interstitial: t('onboarding.prompt.interstitial'),
    q_values: t('onboarding.prompt.values'),
    q_cadence: t('onboarding.prompt.cadence'),
    q_readiness: t('onboarding.prompt.readiness'),
    brandTitle: t('onboarding.prompt.brandTitle'),
    brandSub: t('onboarding.prompt.brandSub'),
    loaderTitle: t('onboarding.prompt.loaderTitle'),
    loaderSub: t('onboarding.prompt.loaderSub'),
    resultsTitle: t('onboarding.prompt.resultsTitle'),
    resultsSub: t('onboarding.prompt.resultsSub'),
  };
}
