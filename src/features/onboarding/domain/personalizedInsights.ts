/**
 * Quiz-answer personalization for weekly reflections and Ember tips.
 */

import type {
  OnboardingDrain,
  OnboardingGoal,
  OnboardingQuizAnswers,
} from '../../../shared/types';
import {
  getLanguage,
  t,
  type TranslationKey,
} from '../../../shared/i18n/translate';

export type PersonalizationPriority = OnboardingGoal | 'rest' | 'other';

// A whole sentence per answer: the grammar around the answer changes between languages.
const PROTECT_KEYS: Record<PersonalizationPriority, TranslationKey> = {
  people: 'reflections.weekly.protect.people',
  focus: 'reflections.weekly.protect.focus',
  health: 'reflections.weekly.protect.health',
  calm: 'reflections.weekly.protect.calm',
  rest: 'reflections.weekly.protect.rest',
  other: 'reflections.weekly.protect.other',
};

const MAP_KEYS: Record<PersonalizationPriority, TranslationKey> = {
  people: 'ember.personal.map.people',
  focus: 'ember.personal.map.focus',
  health: 'ember.personal.map.health',
  calm: 'ember.personal.map.calm',
  rest: 'ember.personal.map.rest',
  other: 'ember.personal.map.other',
};

const LIFE_GRID_KEYS: Record<PersonalizationPriority, TranslationKey> = {
  people: 'ember.personal.lifeGrid.people',
  focus: 'ember.personal.lifeGrid.focus',
  health: 'ember.personal.lifeGrid.health',
  calm: 'ember.personal.lifeGrid.calm',
  rest: 'ember.personal.lifeGrid.rest',
  other: 'ember.personal.lifeGrid.other',
};

const LEAK_KEYS: Record<OnboardingDrain, TranslationKey> = {
  social: 'ember.personal.leak.social',
  work: 'ember.personal.leak.work',
  busywork: 'ember.personal.leak.busywork',
  priorities: 'ember.personal.leak.priorities',
  unsure: 'ember.personal.leak.unsure',
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

/** What the quiz adds to the weekly reflection. */
export interface WeeklyReflectionExtras {
  /** How full the life grid is, 0 to 100. Left out when there is no birth date. */
  lifePercent?: number;
  priority?: PersonalizationPriority;
}

/**
 * The weekly reflection message with the sentences the quiz adds: how full the life grid is and
 * what to protect. Sentences are joined with a space, except in Japanese, which does not use one.
 */
export function weeklyReflectionMessage(
  baseMessage: string,
  extras: WeeklyReflectionExtras,
  translate: typeof t = t
): string {
  const parts = [baseMessage];

  if (extras.lifePercent != null) {
    parts.push(
      translate('reflections.weekly.lifeGrid', { percent: extras.lifePercent })
    );
  }

  if (extras.priority) {
    parts.push(translate(PROTECT_KEYS[extras.priority]));
  }

  return parts.join(getLanguage() === 'ja' ? '' : ' ');
}

export function personalizeWeeklyReflectionMessage(
  baseMessage: string,
  answers: OnboardingQuizAnswers | undefined,
  options: {
    hasBirthDate: boolean;
    lifeProgress?: number;
  }
): string {
  return weeklyReflectionMessage(baseMessage, {
    lifePercent:
      options.hasBirthDate && options.lifeProgress != null
        ? Math.round(options.lifeProgress * 100)
        : undefined,
    priority: resolvePersonalizationPriority(answers),
  });
}

function priorityTip(
  priority: PersonalizationPriority,
  ctx: EmberPersonalizationContext
): { eyebrow: string; body: string } {
  return {
    eyebrow: t('ember.personal.map.eyebrow'),
    // Only the deep-focus sentence uses the number.
    body: t(MAP_KEYS[priority], {
      percent: Math.round((1 - ctx.dayProgress) * 100),
    }),
  };
}

function drainTip(drain: OnboardingDrain): { eyebrow: string; body: string } {
  return {
    eyebrow: t('ember.personal.leak.eyebrow'),
    body: t(LEAK_KEYS[drain]),
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
      eyebrow: t('ember.personal.lifeGrid.eyebrow'),
      body: t(LIFE_GRID_KEYS[priority]),
    });
  }

  if (routeName === 'Settings' && answers.cadence === 'widgets') {
    tips.push({
      eyebrow: t('ember.personal.widgetsFirst.eyebrow'),
      body: t('ember.personal.widgetsFirst.body'),
    });
  }

  return tips;
}
