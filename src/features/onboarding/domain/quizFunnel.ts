/**
 * Pure quiz-funnel helpers — reclaim lookup, results cards, step order.
 */

import type {
  OnboardingCadence,
  OnboardingDrain,
  OnboardingFunnelStep,
  OnboardingQuizAnswers,
} from '../../../shared/types';
import { t } from '../../../shared/i18n/translate';

export const ONBOARDING_FUNNEL_STEPS: readonly OnboardingFunnelStep[] = [
  'brand',
  'day_demo',
  'widgets_demo',
  'q_goal',
  'q_drain',
  'interstitial',
  'identity',
  'life_weeks',
  'q_values',
  'q_cadence',
  'q_readiness',
  'loader',
  'results',
  'paywall',
] as const;

/** Steps that show the top progress bar (excludes brand + paywall). */
export const ONBOARDING_PROGRESS_STEPS = [
  'day_demo',
  'widgets_demo',
  'q_goal',
  'q_drain',
  'interstitial',
  'identity',
  'life_weeks',
  'q_values',
  'q_cadence',
  'q_readiness',
  'loader',
  'results',
] as const;

export type OnboardingProgressStep = (typeof ONBOARDING_PROGRESS_STEPS)[number];

const RECLAIM_HOURS: Record<OnboardingDrain, number> = {
  social: 21,
  work: 18,
  busywork: 15,
  priorities: 12,
  unsure: 14,
};

/** Picking daily check-ins (alone or with widgets) means they want the morning reminder. */
export function wantsDailyCheckIns(cadence: OnboardingCadence | undefined): boolean {
  return cadence === 'checkins' || cadence === 'both';
}

export function getReclaimHours(drain: OnboardingDrain | undefined): number {
  if (!drain) return RECLAIM_HOURS.unsure;
  return RECLAIM_HOURS[drain];
}

export interface OnboardingResultCard {
  id: string;
  text: string;
}

export function buildResultCards(
  answers: OnboardingQuizAnswers
): OnboardingResultCard[] {
  const hours = getReclaimHours(answers.timeDrain);
  const priority = answers.valuesPriority ?? answers.goal ?? 'other';
  const planLabel = t(`onboarding.results.priority.${priority}`);

  let cadenceText = t('onboarding.results.cadence.gentle');
  const cadence: OnboardingCadence | undefined = answers.cadence;
  if (wantsDailyCheckIns(cadence)) {
    cadenceText = t('onboarding.results.cadence.checkins');
  } else if (cadence === 'widgets') {
    cadenceText = t('onboarding.results.cadence.widgets');
  }

  return [
    {
      id: 'reclaim',
      text: t('onboarding.results.reclaim', { hours }),
    },
    {
      id: 'plan',
      text: t('onboarding.results.plan', { priority: planLabel }),
    },
    {
      id: 'cadence',
      text: cadenceText,
    },
  ];
}

/** Display progress per progress-bar step — goal gradient (head start + late ramp). */
const FUNNEL_PROGRESS_BY_STEP: Record<OnboardingProgressStep, number> = {
  day_demo: 0.18,
  widgets_demo: 0.28,
  q_goal: 0.35,
  q_drain: 0.42,
  interstitial: 0.48,
  identity: 0.55,
  life_weeks: 0.68,
  q_values: 0.75,
  q_cadence: 0.82,
  q_readiness: 0.88,
  loader: 0.95,
  results: 1,
};

export function getFunnelProgress(step: OnboardingFunnelStep): number {
  if (!(ONBOARDING_PROGRESS_STEPS as readonly string[]).includes(step)) {
    return 0;
  }
  return FUNNEL_PROGRESS_BY_STEP[step as OnboardingProgressStep];
}

const ENCOURAGEMENT_EARLY = new Set<OnboardingFunnelStep>([
  'day_demo',
  'widgets_demo',
  'q_goal',
  'q_drain',
]);
const ENCOURAGEMENT_MID = new Set<OnboardingFunnelStep>([
  'interstitial',
  'identity',
  'life_weeks',
]);
const ENCOURAGEMENT_LATE = new Set<OnboardingFunnelStep>([
  'q_values',
  'q_cadence',
  'q_readiness',
]);
const ENCOURAGEMENT_FINAL = new Set<OnboardingFunnelStep>([
  'loader',
  'results',
]);

export function getFunnelEncouragement(
  step: OnboardingFunnelStep
): string | null {
  if (ENCOURAGEMENT_EARLY.has(step)) return t('onboarding.encouragement.early');
  if (ENCOURAGEMENT_MID.has(step)) return t('onboarding.encouragement.mid');
  if (ENCOURAGEMENT_LATE.has(step)) return t('onboarding.encouragement.late');
  if (ENCOURAGEMENT_FINAL.has(step)) return t('onboarding.encouragement.final');
  return null;
}

export function nextFunnelStep(
  step: OnboardingFunnelStep
): OnboardingFunnelStep | null {
  const idx = ONBOARDING_FUNNEL_STEPS.indexOf(step);
  if (idx < 0 || idx >= ONBOARDING_FUNNEL_STEPS.length - 1) return null;
  return ONBOARDING_FUNNEL_STEPS[idx + 1]!;
}

export function prevFunnelStep(
  step: OnboardingFunnelStep
): OnboardingFunnelStep | null {
  const idx = ONBOARDING_FUNNEL_STEPS.indexOf(step);
  if (idx <= 0) return null;
  return ONBOARDING_FUNNEL_STEPS[idx - 1]!;
}

export function isValidFunnelStep(value: string): value is OnboardingFunnelStep {
  return (ONBOARDING_FUNNEL_STEPS as readonly string[]).includes(value);
}
