import {
  BIRTH_DATE_PROMPT,
  REFLECTION_TEMPLATES,
} from './reflectionTemplates';
import type {
  DailyReflection,
  ReflectionCategory,
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

function enrichMessage(
  category: ReflectionCategory,
  message: string,
  input: ReflectionInput
): string {
  if (category === 'day') {
    return `${percent(input.dayProgress)}% of today has passed. ${message}`;
  }
  if (category === 'month') {
    return `${percent(input.monthProgress)}% of this month has passed. ${message}`;
  }
  if (category === 'year') {
    return `${percent(input.yearProgress)}% of this year has passed. ${message}`;
  }
  if (category === 'life' && typeof input.lifeProgress === 'number') {
    return `${percent(input.lifeProgress)}% of your expected life has passed. ${message}`;
  }
  return message;
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
    return {
      id: `${dateKey}-birthdate-${tone}`,
      dateKey,
      title: BIRTH_DATE_PROMPT.title,
      message: BIRTH_DATE_PROMPT.message,
      category: 'day',
      tone,
      premium: false,
      action: 'setBirthDate',
    };
  }

  const category = selectReflectionCategory({ ...input, tone });
  const template =
    category === 'weekly'
      ? REFLECTION_TEMPLATES.day[tone]
      : REFLECTION_TEMPLATES[category][tone];

  return {
    id: `${dateKey}-${category}-${tone}`,
    dateKey,
    title: template.title,
    message: enrichMessage(category, template.message, input),
    category,
    tone,
    premium: category === 'life',
  };
}
