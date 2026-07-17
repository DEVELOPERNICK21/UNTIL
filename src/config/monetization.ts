/**
 * Monetization SSOT — pricing, paywall copy, and plan positioning.
 * See docs/MONETIZATION_STRATEGY.md and docs/MONETIZATION_SETUP.md.
 */

export const MONETIZATION_PRICING = {
  monthlyInr: 100,
  yearlyInr: 500,
  lifetimeInr: 1500,
  yearlyStudentInr: 500,
  yearlyRegionalTier2Inr: 399,
  yearlyPerDayDisplay: '₹1.37',
  yearlySavingsVsMonthlyDisplay: '₹700',
} as const;

/** Optional Play products — enable when created in Console. */
export const MONETIZATION_FEATURE_FLAGS = {
  studentPlanEnabled: true,
  /** Show social-proof line when a verified watcher count is set. */
  socialProofEnabled: true,
} as const;

/**
 * Social proof — only show a numeric claim when `verifiedActiveWatchers` is set
 * from a real source (Play Console / analytics). Do not invent counts.
 */
export const PAYWALL_SOCIAL_PROOF = {
  /** null until a verified figure is available — line stays hidden. */
  verifiedActiveWatchers: null as number | null,
  /** Used when `verifiedActiveWatchers` is a positive number. */
  numericTemplate: 'Join {count}+ people watching their life',
} as const;

export function formatPaywallSocialProof(
  count: number | null = PAYWALL_SOCIAL_PROOF.verifiedActiveWatchers
): string | null {
  if (
    !MONETIZATION_FEATURE_FLAGS.socialProofEnabled ||
    count == null ||
    !Number.isFinite(count) ||
    count <= 0
  ) {
    return null;
  }
  const rounded = Math.floor(count);
  const display =
    rounded >= 1000
      ? rounded.toLocaleString('en-IN')
      : String(rounded);
  return PAYWALL_SOCIAL_PROOF.numericTemplate.replace('{count}', display);
}

export const MONETIZATION_TRIAL_DAYS = 5;

/** Trial reminder schedule (day of trial, 1-based) — last 3 days of preview. */
export const TRIAL_REMINDER_DAYS: readonly number[] =
  MONETIZATION_TRIAL_DAYS >= 3
    ? [
        MONETIZATION_TRIAL_DAYS - 2,
        MONETIZATION_TRIAL_DAYS - 1,
        MONETIZATION_TRIAL_DAYS,
      ]
    : [MONETIZATION_TRIAL_DAYS];

export const PAYWALL_DISMISS_COOLDOWN_MS = 48 * 60 * 60 * 1000;

/** Legal pages — must match Play Store listing URLs. */
export const LEGAL_URLS = {
  privacy: 'https://until-app.com/privacy',
  terms: 'https://until-app.com/terms',
} as const;

export const PLAY_SUBSCRIPTION_CANCEL_PATH =
  'Google Play → Payments & subscriptions → Subscriptions';

export const MONETIZATION_PAYWALL_COPY = {
  headline: 'Your life is passing. Start watching it.',
  subheadline:
    'See every day, month, and year of your life — live on your home screen and overlay.',
  /** Shown on yearly plan — subscription bills immediately via Google Play (no Play free trial). */
  yearlyCta: 'Subscribe yearly',
  yearlyCtaSub:
    'Billed at the yearly price shown when you subscribe in Google Play. Cancel anytime in Google Play → Subscriptions before renewal.',
  yearlyCtaSubDuringPreview:
    'Your free app preview does not charge you. Subscribing bills the yearly price in Google Play. Cancel anytime in Google Play → Subscriptions.',
  monthlyCta: 'Monthly',
  monthlySub:
    'Billed monthly in Google Play when you subscribe. Cancel anytime in Google Play → Subscriptions.',
  lifetimeCta: 'Own it forever',
  lifetimeSub: 'One-time payment in Google Play · all Premium features · no renewal',
  studentCta: 'Student yearly',
  studentSub: 'Verify with a school email · same Premium features',
  regionalNote:
    'Prices in your currency are set by Google Play (regional pricing may apply).',
  previewActiveTitle: 'Free app preview active',
  previewActiveBody:
    'Premium features unlocked for {days} — no payment or subscription yet. When the preview ends, Premium locks unless you subscribe. You will not be charged automatically.',
  subscriptionDisclosureTitle: 'Subscription & preview terms',
  lifeUnlockEndedTitle: 'Keep your life progress visible',
  lifeUnlockEndedMessage:
    'Your 24-hour Life preview ended. Premium keeps your life %, month widget, and overlay on every day.',
  onboardingPaywallTitle: 'Keep your time map.',
  onboardingPaywallSub:
    'Month, life, and overlay stay with you — so the plan you just built doesn’t disappear.',
  previewEndingNoChargeNote:
    'No payment is taken during the free app preview. You are only charged if you choose to subscribe in Google Play.',
  previewEndingCancelNote:
    'To cancel an active subscription: open Google Play → Payments & subscriptions → Subscriptions → UNTIL.',
  freeForeverLine: 'Day & year widgets and Share stay free forever.',
} as const;

export const PREMIUM_BENEFITS = [
  'Month & Life home screen widgets',
  'Full Life progress screen',
  'Floating overlay — month & life (Android)',
  'Dynamic Island — month & life (iOS)',
  'Activity intervention alerts',
  `${MONETIZATION_TRIAL_DAYS}-day free app preview (no payment)`,
] as const;

export const PAYWALL_TRUST_SIGNALS = [
  `Free ${MONETIZATION_TRIAL_DAYS}-day app preview — no Google Play charge`,
  'No automatic charge when the preview ends',
  `Cancel subscriptions in ${PLAY_SUBSCRIPTION_CANCEL_PATH}`,
  'Day + Year widgets free forever',
  'Secure payment via Google Play',
] as const;

/** Days left in the in-app preview (ceil), 0 if ended or unknown. */
export function trialPreviewDaysLeft(
  trialEndsAtMs: number | null,
  nowMs: number = Date.now()
): number {
  if (trialEndsAtMs == null || nowMs >= trialEndsAtMs) return 0;
  return Math.ceil((trialEndsAtMs - nowMs) / (24 * 60 * 60 * 1000));
}

export function formatPreviewActiveBody(trialEndsAtMs: number | null): string {
  const days = trialPreviewDaysLeft(trialEndsAtMs);
  const dayLabel = days === 1 ? '1 day' : `${days} days`;
  const base = MONETIZATION_PAYWALL_COPY.previewActiveBody.replace('{days}', dayLabel);
  const endDate = formatPreviewEndDate(trialEndsAtMs);
  return endDate ? `${base} Preview ends ${endDate}.` : base;
}

export function formatPreviewEndDate(trialEndsAtMs: number | null): string | null {
  if (trialEndsAtMs == null) return null;
  return new Date(trialEndsAtMs).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function buildSubscriptionDisclosure(params: {
  yearlyPrice: string;
  monthlyPrice: string;
  lifetimePrice: string;
  trialActive: boolean;
  trialEndsAtMs: number | null;
}): readonly string[] {
  const lines: string[] = [];
  const daysLeft = trialPreviewDaysLeft(params.trialEndsAtMs);
  const endDate = formatPreviewEndDate(params.trialEndsAtMs);

  if (params.trialActive && daysLeft > 0) {
    lines.push(
      `${MONETIZATION_TRIAL_DAYS}-day free app preview (in-app only — not a Google Play subscription trial). No payment is required during the preview.`
    );
    if (endDate) {
      lines.push(
        `Preview ends ${endDate} (${daysLeft === 1 ? '1 day' : `${daysLeft} days`} left). Premium features lock after that unless you subscribe. You will not be charged automatically when the preview ends.`
      );
    }
  }

  lines.push(
    `Yearly subscription: ${params.yearlyPrice}/year. Google Play charges this amount when you subscribe. Renews yearly until you cancel at least 24 hours before renewal in ${PLAY_SUBSCRIPTION_CANCEL_PATH}.`
  );
  lines.push(
    `Monthly subscription: ${params.monthlyPrice}/month. Billed when you subscribe. Cancel anytime in ${PLAY_SUBSCRIPTION_CANCEL_PATH}.`
  );
  lines.push(
    `Lifetime: ${params.lifetimePrice} one-time payment in Google Play. No renewal.`
  );

  return lines;
}

export function formatPreviewEndingMessage(
  trialDay: number,
  yearlyPrice: string = FALLBACK_YEARLY_PRICE
): string {
  const total = MONETIZATION_TRIAL_DAYS;
  const cancelPath = PLAY_SUBSCRIPTION_CANCEL_PATH;

  if (trialDay >= total) {
    return `Your free app preview ends today. You will not be charged unless you subscribe. To keep Premium, subscribe at ${yearlyPrice}/year in Google Play. Cancel any subscription in ${cancelPath}.`;
  }
  if (trialDay === total - 1) {
    return `Your free app preview ends tomorrow. No automatic charge. Subscribe at ${yearlyPrice}/year in Google Play to keep month & life widgets. Cancel in ${cancelPath}.`;
  }
  const daysLeft = total - trialDay;
  const leftLabel = daysLeft === 1 ? '1 day' : `${daysLeft} days`;
  return `${leftLabel} left in your free app preview. No payment during the preview. Subscribe at ${yearlyPrice}/year when ready — cancel anytime in ${cancelPath}.`;
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const FALLBACK_MONTHLY_PRICE = formatInr(MONETIZATION_PRICING.monthlyInr);
export const FALLBACK_YEARLY_PRICE = formatInr(MONETIZATION_PRICING.yearlyInr);
export const FALLBACK_LIFETIME_PRICE = formatInr(MONETIZATION_PRICING.lifetimeInr);
export const FALLBACK_STUDENT_YEARLY_PRICE = formatInr(
  MONETIZATION_PRICING.yearlyStudentInr
);
