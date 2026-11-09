/**
 * Words for a plan: its name, the line about when it ends or renews, and who bills it.
 * Everything here goes through the active language.
 */

import {
  t,
  formatDate,
  type TranslationKey,
} from '../../../shared/i18n/translate';
import type { PlanKind, PlanRecord } from '../../../shared/types/purchases';
import type { PlanTimeline } from '../domain/plan';

type Translate = typeof t;
type FormatDate = typeof formatDate;

const PLAN_NAME_KEY: Record<PlanKind, TranslationKey> = {
  weekly: 'premium.plan.name.weekly',
  monthly: 'premium.plan.name.monthly',
  yearly: 'premium.plan.name.yearly',
  student: 'premium.plan.name.student',
  lifetime: 'premium.plan.name.lifetime',
};

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

export function planName(kind: PlanKind, translate: Translate = t): string {
  return translate(PLAN_NAME_KEY[kind]);
}

/** "Renews on 8 November 2027", "Yours for good", or null when the store gave no date. */
export function timelineText(
  timeline: PlanTimeline | null,
  translate: Translate = t,
  format: FormatDate = formatDate,
): string | null {
  if (!timeline || timeline.kind === 'unknown') return null;
  if (timeline.kind === 'forever') return translate('premium.plan.forever');
  const date = format(new Date(timeline.onMs), DATE_FORMAT);
  if (timeline.kind === 'renews') return translate('premium.plan.renews', { date });
  if (timeline.kind === 'trialEnds') return translate('premium.plan.trialEnds', { date });
  return translate('premium.plan.ends', { date });
}

export function sinceText(
  plan: PlanRecord,
  translate: Translate = t,
  format: FormatDate = formatDate,
): string | null {
  if (plan.startedMs == null) return null;
  return translate('premium.plan.since', {
    date: format(new Date(plan.startedMs), DATE_FORMAT),
  });
}

export function storeName(
  store: PlanRecord['store'],
  translate: Translate = t,
): string | null {
  if (store === 'play') return translate('premium.plan.store.play');
  if (store === 'app_store') return translate('premium.plan.store.appStore');
  return null;
}
