import type { TranslationKey } from '../../../shared/i18n/translate';
import type { ReflectionCategory, ReflectionTone } from './reflectionTypes';

/** The title and message of a reflection, as message keys in the `reflections` namespace. */
export interface ReflectionTemplate {
  title: TranslationKey;
  message: TranslationKey;
}

type TemplateMap = Record<
  ReflectionCategory,
  Record<ReflectionTone, ReflectionTemplate>
>;

export const REFLECTION_TEMPLATES: TemplateMap = {
  day: {
    quiet: {
      title: 'reflections.day.quiet.title',
      message: 'reflections.day.quiet.message',
    },
    radical: {
      title: 'reflections.day.radical.title',
      message: 'reflections.day.radical.message',
    },
  },
  month: {
    quiet: {
      title: 'reflections.month.quiet.title',
      message: 'reflections.month.quiet.message',
    },
    radical: {
      title: 'reflections.month.radical.title',
      message: 'reflections.month.radical.message',
    },
  },
  year: {
    quiet: {
      title: 'reflections.year.quiet.title',
      message: 'reflections.year.quiet.message',
    },
    radical: {
      title: 'reflections.year.radical.title',
      message: 'reflections.year.radical.message',
    },
  },
  life: {
    quiet: {
      title: 'reflections.life.quiet.title',
      message: 'reflections.life.quiet.message',
    },
    radical: {
      title: 'reflections.life.radical.title',
      message: 'reflections.life.radical.message',
    },
  },
  weekly: {
    quiet: {
      title: 'reflections.weekly.quiet.title',
      message: 'reflections.weekly.quiet.message',
    },
    radical: {
      title: 'reflections.weekly.radical.title',
      message: 'reflections.weekly.radical.message',
    },
  },
};

export const BIRTH_DATE_PROMPT: ReflectionTemplate = {
  title: 'reflections.birthDate.title',
  message: 'reflections.birthDate.message',
};

/** "42% of today has passed. {{message}}": a whole sentence per period, with the message inside. */
export const PERCENT_PREFIX_KEYS: Record<
  Exclude<ReflectionCategory, 'weekly'>,
  TranslationKey
> = {
  day: 'reflections.percent.day',
  month: 'reflections.percent.month',
  year: 'reflections.percent.year',
  life: 'reflections.percent.life',
};
