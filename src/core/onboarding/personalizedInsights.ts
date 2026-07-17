/**
 * Quiz-answer personalization for weekly reflections and Ember tips.
 */

import type {
  OnboardingDrain,
  OnboardingGoal,
  OnboardingQuizAnswers,
} from '../../types';

export type PersonalizationPriority = OnboardingGoal | 'rest' | 'other';

const PRIORITY_LABELS: Record<PersonalizationPriority, string> = {
  people: 'time with people',
  focus: 'deep focus',
  health: 'health and energy',
  calm: 'calm and less doomscroll',
  rest: 'protected rest',
  other: 'what matters to you',
};

const DRAIN_LABELS: Record<OnboardingDrain, string> = {
  social: 'phone and social scrolling',
  work: 'work overflow',
  busywork: 'busywork and decisions',
  priorities: 'unclear priorities',
  unsure: 'quiet leaks',
};

export interface EmberPersonalizationContext {
  dayProgress: number;
  streakCount?: number;
}

export function resolvePersonalizationPriority(
  answers: OnboardingQuizAnswers | undefined
): PersonalizationPriority | undefined {
  if (!answers) return undefined;
  return answers.valuesPriority ?? answers.goal;
}

export function personalizeWeeklyReflectionMessage(
  baseMessage: string,
  answers: OnboardingQuizAnswers | undefined,
  options: {
    hasBirthDate: boolean;
    lifeProgress?: number;
  }
): string {
  const parts = [baseMessage];
  const priority = resolvePersonalizationPriority(answers);

  if (options.hasBirthDate && options.lifeProgress != null) {
    const pct = Math.round(options.lifeProgress * 100);
    parts.push(
      `Your life grid is ${pct}% complete — this week is one more row crossed.`
    );
  }

  if (priority) {
    const label = PRIORITY_LABELS[priority];
    parts.push(`Guard ${label} before the week fills with noise.`);
  }

  return parts.join(' ');
}

function priorityTip(
  priority: PersonalizationPriority,
  ctx: EmberPersonalizationContext
): { eyebrow: string; body: string } {
  const label = PRIORITY_LABELS[priority];
  if (priority === 'calm') {
    return {
      eyebrow: 'Your map',
      body: `You wanted less doomscroll — notice when ${label} slips away today.`,
    };
  }
  if (priority === 'focus') {
    return {
      eyebrow: 'Your map',
      body: `Deep focus was your pick. Protect one quiet block before ${Math.round(
        (1 - ctx.dayProgress) * 100
      )}% of today is gone.`,
    };
  }
  return {
    eyebrow: 'Your map',
    body: `Your plan centers on ${label}. One small move today still counts.`,
  };
}

function drainTip(drain: OnboardingDrain): { eyebrow: string; body: string } {
  return {
    eyebrow: 'Leak watch',
    body: `You named ${DRAIN_LABELS[drain]} as the drain. Catch one leak before it spreads.`,
  };
}

export function personalizedEmberTipsForRoute(
  routeName: string,
  answers: OnboardingQuizAnswers | undefined,
  ctx: EmberPersonalizationContext
): Array<{ eyebrow: string; body: string }> {
  if (!answers) return [];

  const tips: Array<{ eyebrow: string; body: string }> = [];
  const priority = resolvePersonalizationPriority(answers);

  if (priority) {
    tips.push(priorityTip(priority, ctx));
  }

  if (answers.timeDrain && answers.timeDrain !== 'unsure') {
    tips.push(drainTip(answers.timeDrain));
  }

  if (routeName === 'Life' && priority) {
    tips.push({
      eyebrow: 'Life grid',
      body: `Zoom out kindly — ${PRIORITY_LABELS[priority]} still fits in a finite life.`,
    });
  }

  if (routeName === 'Settings' && answers.cadence === 'widgets') {
    tips.push({
      eyebrow: 'Widgets first',
      body: 'You chose widgets over check-ins — a glance can still change a day.',
    });
  }

  return tips;
}
