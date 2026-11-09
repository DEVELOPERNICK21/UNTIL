/**
 * Paywall and preview text that is assembled from messages, store prices and dates.
 * Pricing numbers live in ./monetization; the words live in the `premium` locale files.
 * Prices come from the store already formatted for the person's region and are never translated.
 */

import {
  formatDate,
  getLanguage,
  t,
  type TranslationKey,
} from '../shared/i18n/translate';
import {
  FALLBACK_YEARLY_PRICE,
  MONETIZATION_FEATURE_FLAGS,
  MONETIZATION_TRIAL_DAYS,
  PAYWALL_SOCIAL_PROOF,
  trialPreviewDaysLeft,
  type RenewalInterval,
} from './monetization';

/** Sentences are separated by a space, except in Japanese, which does not use one. */
export function joinSentences(...sentences: string[]): string {
  return sentences.join(getLanguage() === 'ja' ? '' : ' ');
}

export function manageSubscriptionPath(): string {
  return t('premium.manage.path');
}

const SUBSCRIBE_CTA: Record<RenewalInterval, TranslationKey> = {
  week: 'premium.cta.subscribeWeek',
  month: 'premium.cta.subscribeMonth',
  year: 'premium.cta.subscribeYear',
};

const RENEWAL_TERMS: Record<RenewalInterval, TranslationKey> = {
  week: 'premium.renewal.week',
  month: 'premium.renewal.month',
  year: 'premium.renewal.year',
};

/** Button label that states the renewal (affirmative consent to auto-renew). */
export function formatSubscribeCta(interval: RenewalInterval): string {
  return t(SUBSCRIBE_CTA[interval]);
}

/** Always-visible auto-renewal terms shown directly under the subscribe button. */
export function formatRenewalTerms(
  price: string,
  interval: RenewalInterval,
): string {
  return t(RENEWAL_TERMS[interval], {
    price,
    path: manageSubscriptionPath(),
  });
}

export function formatPaywallSocialProof(
  count: number | null = PAYWALL_SOCIAL_PROOF.verifiedActiveWatchers,
): string | null {
  if (
    !MONETIZATION_FEATURE_FLAGS.socialProofEnabled ||
    count == null ||
    !Number.isFinite(count) ||
    count <= 0
  ) {
    return null;
  }
  return t('premium.paywall.socialProof', { count: Math.floor(count) });
}

/** What the person keeps losing without Premium. Honest claims only; no fake scarcity. */
export function paywallLossLines(): string[] {
  return [
    t('premium.loss.month'),
    t('premium.loss.life'),
    t('premium.loss.hours'),
  ];
}

export function formatPaywallLossHeadline(
  lifeProgress: number | undefined,
): string {
  if (
    typeof lifeProgress === 'number' &&
    Number.isFinite(lifeProgress) &&
    lifeProgress > 0 &&
    lifeProgress < 1
  ) {
    const pct = Math.max(1, Math.min(99, Math.round(lifeProgress * 100)));
    return t('premium.loss.headlineWithLife', { pct });
  }
  return t('premium.loss.headlineFallback');
}

export function formatPaywallLossPreviewFooter(
  trialEndsAtMs: number | null,
  trialActive: boolean,
): string | null {
  if (!trialActive) return null;
  const days = trialPreviewDaysLeft(trialEndsAtMs);
  if (days <= 0) return null;
  return t('premium.loss.previewFooter', { count: days });
}

export function formatPreviewEndDate(
  trialEndsAtMs: number | null,
): string | null {
  if (trialEndsAtMs == null) return null;
  return formatDate(new Date(trialEndsAtMs), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPreviewActiveBody(trialEndsAtMs: number | null): string {
  const days = trialPreviewDaysLeft(trialEndsAtMs);
  const base = joinSentences(
    t('premium.preview.activeLead', { count: days }),
    t('premium.preview.activeRest'),
  );
  const endDate = formatPreviewEndDate(trialEndsAtMs);
  return endDate
    ? joinSentences(base, t('premium.preview.ends', { date: endDate }))
    : base;
}

export function buildSubscriptionDisclosure(params: {
  yearlyPrice: string;
  monthlyPrice: string;
  weeklyPrice?: string;
  lifetimePrice: string;
  trialActive: boolean;
  trialEndsAtMs: number | null;
}): readonly string[] {
  const lines: string[] = [];
  const path = manageSubscriptionPath();
  const daysLeft = trialPreviewDaysLeft(params.trialEndsAtMs);
  const endDate = formatPreviewEndDate(params.trialEndsAtMs);

  if (params.trialActive && daysLeft > 0) {
    lines.push(
      t('premium.disclosure.preview', { days: MONETIZATION_TRIAL_DAYS }),
    );
    if (endDate) {
      lines.push(
        joinSentences(
          t('premium.disclosure.previewEnds', {
            date: endDate,
            count: daysLeft,
          }),
          t('premium.disclosure.previewEndsRest'),
        ),
      );
    }
  }

  lines.push(
    t('premium.disclosure.yearly', { price: params.yearlyPrice, path }),
  );
  lines.push(
    t('premium.disclosure.monthly', { price: params.monthlyPrice, path }),
  );
  if (params.weeklyPrice) {
    lines.push(
      t('premium.disclosure.weekly', { price: params.weeklyPrice, path }),
    );
  }
  lines.push(t('premium.disclosure.lifetime', { price: params.lifetimePrice }));

  return lines;
}

export function formatPreviewEndingMessage(
  trialDay: number,
  yearlyPrice: string = FALLBACK_YEARLY_PRICE,
): string {
  const total = MONETIZATION_TRIAL_DAYS;
  const path = manageSubscriptionPath();

  if (trialDay >= total) {
    return t('premium.preview.endingToday', { price: yearlyPrice, path });
  }
  if (trialDay === total - 1) {
    return t('premium.preview.endingTomorrow', { price: yearlyPrice, path });
  }
  return t('premium.preview.daysLeft', {
    count: total - trialDay,
    price: yearlyPrice,
    path,
  });
}
