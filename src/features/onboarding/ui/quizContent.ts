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
  /** A small picture that says the answer at a glance. Emoji, so it needs no translation. */
  emoji?: string;
}

export function getGoalOptions(): QuizOption<OnboardingGoal>[] {
  return [
    { value: 'people', label: t('onboarding.goal.people'), emoji: '🫶' },
    { value: 'focus', label: t('onboarding.goal.focus'), emoji: '🎯' },
    { value: 'health', label: t('onboarding.goal.health'), emoji: '💚' },
    { value: 'calm', label: t('onboarding.goal.calm'), emoji: '🌿' },
    { value: 'other', label: t('onboarding.goal.other'), emoji: '✨' },
  ];
}

export function getDrainOptions(): QuizOption<OnboardingDrain>[] {
  return [
    { value: 'social', label: t('onboarding.drain.social'), emoji: '📱' },
    { value: 'work', label: t('onboarding.drain.work'), emoji: '💼' },
    { value: 'busywork', label: t('onboarding.drain.busywork'), emoji: '🗂️' },
    { value: 'priorities', label: t('onboarding.drain.priorities'), emoji: '🧭' },
    { value: 'unsure', label: t('onboarding.drain.unsure'), emoji: '🤔' },
  ];
}

export function getValuesOptions(): QuizOption<OnboardingValues>[] {
  return [
    { value: 'people', label: t('onboarding.values.people'), emoji: '🫶' },
    { value: 'focus', label: t('onboarding.values.focus'), emoji: '🎯' },
    { value: 'health', label: t('onboarding.values.health'), emoji: '💚' },
    { value: 'calm', label: t('onboarding.values.calm'), emoji: '🌿' },
    { value: 'rest', label: t('onboarding.values.rest'), emoji: '🌙' },
    { value: 'other', label: t('onboarding.values.other'), emoji: '✨' },
  ];
}

export function getCadenceOptions(): QuizOption<OnboardingCadence>[] {
  return [
    { value: 'checkins', label: t('onboarding.cadence.checkins'), emoji: '🔔' },
    { value: 'widgets', label: t('onboarding.cadence.widgets'), emoji: '🧩' },
    { value: 'both', label: t('onboarding.cadence.both'), emoji: '🌟' },
    { value: 'unsure', label: t('onboarding.cadence.unsure'), emoji: '🤔' },
  ];
}

export function getReadinessOptions(): QuizOption<OnboardingReadiness>[] {
  return [
    { value: 'ready', label: t('onboarding.readiness.ready'), emoji: '🚀' },
    { value: 'gentle', label: t('onboarding.readiness.gentle'), emoji: '🌱' },
    { value: 'exploring', label: t('onboarding.readiness.exploring'), emoji: '👀' },
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
