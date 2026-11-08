import {
  t,
  formatDate,
  type TranslationKey,
} from '../../../shared/i18n/translate';
import type { BadgeDefinition, BadgeMetric } from '../domain/badgeCatalog';
import type { BadgeView } from '../domain/useCases/GetBadgesUseCase';

type Translate = typeof t;
type FormatDate = typeof formatDate;

/** Messages for "5 of 7 <unit>"; the unit agrees with the target, so it is the plural `count`. */
const PROGRESS_KEY: Partial<Record<BadgeMetric, TranslationKey>> = {
  longestStreak: 'badges.progress.days',
  tasksCompleted: 'badges.progress.tasks',
  perfectDays: 'badges.progress.days',
  appOpens: 'badges.progress.opens',
};

export function badgeTitle(
  definition: BadgeDefinition,
  translate: Translate = t,
): string {
  return translate(definition.titleKey);
}

export function badgeDescription(
  definition: BadgeDefinition,
  translate: Translate = t,
): string {
  return translate(definition.descriptionKey, definition.descriptionParams);
}

/** "5 of 7 days" for counters, "Not yet" for one-step badges. */
export function progressLabel(
  view: BadgeView,
  translate: Translate = t,
): string {
  const { value, target } = view.progress;
  if (target === 1) {
    return translate(
      view.earned ? 'badges.progress.done' : 'badges.progress.notYet',
    );
  }
  const shown = Math.min(value, target);
  const key = PROGRESS_KEY[view.definition.metric];
  return key
    ? translate(key, { value: shown, count: target })
    : translate('badges.progress.plain', { value: shown, target });
}

/** "Oct 1, 2026" (in the active language) from a local YYYY-MM-DD key. */
export function formatEarnedDate(
  dateKey: string | null,
  format: FormatDate = formatDate,
): string {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return '';
  return format(new Date(y, m - 1, d), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
