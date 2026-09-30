import type { BadgeMetric } from '../../domain/badges/badgeCatalog';
import type { BadgeView } from '../../domain/useCases/GetBadgesUseCase';

const UNIT: Partial<Record<BadgeMetric, string>> = {
  longestStreak: 'days',
  tasksCompleted: 'tasks',
  perfectDays: 'days',
  appOpens: 'opens',
};

/** "5 of 7 days" for counters, "Not yet" for one-step badges. */
export function progressLabel(view: BadgeView): string {
  const { value, target } = view.progress;
  if (target === 1) return view.earned ? 'Done' : 'Not yet';
  const unit = UNIT[view.definition.metric];
  const shown = Math.min(value, target);
  return unit ? `${shown} of ${target} ${unit}` : `${shown} of ${target}`;
}

/** "Oct 1, 2026" from a local YYYY-MM-DD key. */
export function formatEarnedDate(dateKey: string | null): string {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
