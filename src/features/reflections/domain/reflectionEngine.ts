import {
  resolvePersonalizationPriority,
  weeklyReflectionMessage,
} from '../../onboarding/domain';
import { t } from '../../../shared/i18n/translate';
import {
  BIRTH_DATE_PROMPT,
  PERCENT_PREFIX_KEYS,
  REFLECTION_TEMPLATES,
} from './reflectionTemplates';
import type {
  DailyReflection,
  ReflectionCategory,
  ReflectionCopy,
  ReflectionInput,
  ReflectionTone,
} from './reflectionTypes';

function clampProgress(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function percent(value: number): number {
  return Math.round(clampProgress(value) * 100);
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function canUseLifeReflection(input: ReflectionInput): boolean {
  return (
    input.hasBirthDate &&
    input.hasPremiumBundle &&
    typeof input.lifeProgress === 'number'
  );
}

export function selectReflectionCategory(input: ReflectionInput): ReflectionCategory {
  const hour = input.date.getHours();

  if (
    input.date.getDay() === 0 &&
    hour < 18 &&
    input.dayProgress < 0.75
  ) {
    return 'weekly';
  }

  if (hour >= 18 || input.dayProgress >= 0.75) {
    return 'day';
  }

  if (canUseLifeReflection(input) && input.date.getDate() % 3 === 0) {
    return 'life';
  }

  if (input.monthProgress >= 0.5 || input.date.getDate() % 2 === 0) {
    return 'month';
  }

  return 'year';
}

/** The share to put in front of the message: day, month and year always, life when it is known. */
function percentFor(
  category: ReflectionCategory,
  input: ReflectionInput
): number | undefined {
  if (category === 'day') return percent(input.dayProgress);
  if (category === 'month') return percent(input.monthProgress);
  if (category === 'year') return percent(input.yearProgress);
  if (category === 'life' && typeof input.lifeProgress === 'number') {
    return percent(input.lifeProgress);
  }
  return undefined;
}

/** Writes a reflection's title and message from what it is made of, in the active language. */
export function renderReflection(
  copy: ReflectionCopy,
  translate: typeof t = t
): { title: string; message: string } {
  if (copy.kind === 'birthDatePrompt') {
    return {
      title: translate(BIRTH_DATE_PROMPT.title),
      message: translate(BIRTH_DATE_PROMPT.message),
    };
  }

  const template = REFLECTION_TEMPLATES[copy.category][copy.tone];
  const base = translate(template.message);
  let message = base;
  if (copy.category === 'weekly') {
    message = weeklyReflectionMessage(
      base,
      { lifePercent: copy.lifeGridPercent, priority: copy.priority },
      translate
    );
  } else if (copy.percent != null) {
    message = translate(PERCENT_PREFIX_KEYS[copy.category], {
      percent: copy.percent,
      message: base,
    });
  }
  return { title: translate(template.title), message };
}

/**
 * A saved reflection with its text written again in the active language. One saved by an older
 * version has no `copy`, so it keeps the text it was saved with.
 */
export function localizeReflection(reflection: DailyReflection): DailyReflection {
  return reflection.copy
    ? { ...reflection, ...renderReflection(reflection.copy) }
    : reflection;
}

export function normalizeReflectionTone(
  tone: string | undefined,
  canUsePremiumReflections: boolean
): ReflectionTone {
  if (tone === 'radical' && canUsePremiumReflections) return 'radical';
  return 'quiet';
}

export function generateDailyReflection(input: ReflectionInput): DailyReflection {
  const dateKey = getDateKey(input.date);
  const tone = normalizeReflectionTone(input.tone, input.hasPremiumBundle);

  if (!input.hasBirthDate && input.date.getDate() % 5 === 0) {
    const copy: ReflectionCopy = { kind: 'birthDatePrompt' };
    return {
      id: `${dateKey}-birthdate-${tone}`,
      dateKey,
      ...renderReflection(copy),
      category: 'day',
      tone,
      premium: false,
      action: 'setBirthDate',
      copy,
    };
  }

  const category = selectReflectionCategory({ ...input, tone });
  const copy: ReflectionCopy = {
    kind: 'template',
    category,
    tone,
    percent: percentFor(category, input),
    ...(category === 'weekly'
      ? {
          lifeGridPercent:
            input.hasBirthDate && input.lifeProgress != null
              ? Math.round(input.lifeProgress * 100)
              : undefined,
          priority: resolvePersonalizationPriority(input.quizAnswers),
        }
      : {}),
  };

  return {
    id: `${dateKey}-${category}-${tone}`,
    dateKey,
    ...renderReflection(copy),
    category,
    tone,
    premium: category === 'life',
    copy,
  };
}
