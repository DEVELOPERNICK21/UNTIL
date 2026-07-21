/**
 * Onboarding quiz question copy (UI layer).
 */

import type {
  OnboardingCadence,
  OnboardingDrain,
  OnboardingGoal,
  OnboardingReadiness,
  OnboardingValues,
} from '../../types';

export interface QuizOption<T extends string> {
  value: T;
  label: string;
}

export const GOAL_OPTIONS: QuizOption<OnboardingGoal>[] = [
  { value: 'people', label: 'Time with people' },
  { value: 'focus', label: 'Focus / deep work' },
  { value: 'health', label: 'Health & energy' },
  { value: 'calm', label: 'Calm / less doomscroll' },
  { value: 'other', label: 'Something else' },
];

export const DRAIN_OPTIONS: QuizOption<OnboardingDrain>[] = [
  { value: 'social', label: 'Social / phone' },
  { value: 'work', label: 'Work overflow' },
  { value: 'busywork', label: 'Decisions & busywork' },
  { value: 'priorities', label: 'Unclear priorities' },
  { value: 'unsure', label: 'Not sure' },
];

export const VALUES_OPTIONS: QuizOption<OnboardingValues>[] = [
  { value: 'people', label: 'Time with people' },
  { value: 'focus', label: 'Focus / deep work' },
  { value: 'health', label: 'Health & energy' },
  { value: 'calm', label: 'Calm / less doomscroll' },
  { value: 'rest', label: 'Protect rest' },
  { value: 'other', label: 'Something else' },
];

export const CADENCE_OPTIONS: QuizOption<OnboardingCadence>[] = [
  { value: 'checkins', label: 'Daily check-in' },
  { value: 'widgets', label: 'Widgets only' },
  { value: 'both', label: 'Both' },
  { value: 'unsure', label: 'Not sure yet' },
];

export const READINESS_OPTIONS: QuizOption<OnboardingReadiness>[] = [
  { value: 'ready', label: 'Yes, build my map' },
  { value: 'gentle', label: 'I want a gentle start' },
  { value: 'exploring', label: 'Just exploring' },
];

export const QUIZ_PROMPTS = {
  q_goal: 'What do you want more of?',
  q_drain: 'Where does most of your time leak?',
  interstitial:
    'Most people underestimate lost hours. Small daily leaks add up to about 15–25 hrs/week.',
  q_values: 'If you reclaimed 10 hrs/week, what comes first?',
  q_cadence: 'How do you want UNTIL to show up?',
  q_readiness: 'Ready to watch your time on purpose?',
  brandTitle: 'Your time is limited.',
  brandSub:
    'UNTIL makes that visible so you spend it on purpose. Day, month, year, and life on screen and as home widgets.',
  loaderTitle: 'Building your time map…',
  resultsTitle: 'Your time map is ready',
  resultsSub: 'Based on your 5 answers',
} as const;
