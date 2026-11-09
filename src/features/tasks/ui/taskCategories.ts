import { t, type TranslationKey } from '../../../shared/i18n/translate';
import type { TaskCategory } from '../../../shared/types';

const CATEGORY_KEYS: Record<TaskCategory, TranslationKey> = {
  health: 'tasks.category.health',
  work: 'tasks.category.work',
  personal_care: 'tasks.category.personalCare',
  learning: 'tasks.category.learning',
  other: 'tasks.category.other',
};

/** Pass the hook's `t` from a component so memoised callers recompute on a language change. */
export function taskCategoryLabel(
  category: TaskCategory,
  translate: typeof t = t,
): string {
  const key = CATEGORY_KEYS[category];
  return key ? translate(key) : category;
}

/** Category chips in display order, labelled in the active language. */
export function getTaskCategoryOptions(): {
  value: TaskCategory;
  label: string;
}[] {
  return (Object.keys(CATEGORY_KEYS) as TaskCategory[]).map(value => ({
    value,
    label: taskCategoryLabel(value),
  }));
}
