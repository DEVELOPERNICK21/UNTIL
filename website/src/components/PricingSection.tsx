'use client';

import { useState } from 'react';
import {
  PRICING_PLAN_CARDS,
  PRICING_DISPLAY,
  type PricingPlanId,
} from '@/domain/pricing';
import { SITE_CONFIG } from '@/domain';

type BillingFocus = 'monthly' | 'yearly';

export function PricingSection() {
  const [focus, setFocus] = useState<BillingFocus>('yearly');
  const { pricing } = SITE_CONFIG;
  const playUrl = SITE_CONFIG.playStoreUrl;

  const cards = PRICING_PLAN_CARDS.map(card => {
    if (card.id === 'yearly' && focus === 'yearly') {
      return { ...card, ctaVariant: 'primary' as const };
    }
    if (card.id === 'monthly' && focus === 'monthly') {
      return { ...card, ctaVariant: 'primary' as const, badge: card.badge ?? 'Flexible' };
    }
    if (card.id === 'yearly' && focus === 'monthly') {
      return { ...card, ctaVariant: 'secondary' as const };
    }
    if (card.id === 'monthly' && focus === 'yearly') {
      return { ...card, ctaVariant: 'secondary' as const };
    }
    return card;
  });

  return (
    <section className="landing-pricing-section" style={{ borderTop: '1px solid var(--divider)' }}>
      <div className="landing-pricing-header">
        <h2 className="landing-pricing-title">Pricing</h2>
        <p className="landing-pricing-subtitle">{PRICING_DISPLAY.trialLine}</p>
        <div className="landing-pricing-toggle" role="group" aria-label="Billing focus">
          <button
            type="button"
            className={focus === 'monthly' ? 'is-active' : undefined}
            aria-pressed={focus === 'monthly'}
            onClick={() => setFocus('monthly')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={focus === 'yearly' ? 'is-active' : undefined}
            aria-pressed={focus === 'yearly'}
            onClick={() => setFocus('yearly')}
          >
            Yearly
          </button>
        </div>
        <p className="landing-pricing-note">{pricing.currencyNote}</p>
      </div>

      <div className="landing-pricing-grid">
        {cards.map(card => (
          <PricingCard
            key={card.id}
            planId={card.id}
            name={card.name}
            tagline={card.tagline}
            priceLabel={card.priceLabel}
            priceHint={card.priceHint}
            ctaLabel={card.ctaLabel}
            ctaVariant={card.ctaVariant}
            includesLabel={card.includesLabel}
            features={card.features}
            badge={card.badge}
            href={playUrl}
            highlighted={
              (focus === 'yearly' && card.id === 'yearly') ||
              (focus === 'monthly' && card.id === 'monthly')
            }
          />
        ))}
      </div>
    </section>
  );
}

function splitPriceLabel(label: string): {
  currency?: string;
  amount: string;
  period?: string;
} {
  const free = label.trim().toLowerCase() === 'free';
  if (free) return { amount: 'Free' };
  const m = label.match(/^(₹)?([\d,]+)(.*)$/);
  if (!m) return { amount: label };
  return {
    currency: m[1] || undefined,
    amount: m[2] ?? label,
    period: m[3]?.trim() || undefined,
  };
}

function PricingCard(props: {
  planId: PricingPlanId;
  name: string;
  tagline: string;
  priceLabel: string;
  priceHint?: string;
  ctaLabel: string;
  ctaVariant: 'primary' | 'secondary';
  includesLabel: string;
  features: readonly string[];
  badge?: string;
  href: string;
  highlighted: boolean;
}) {
  const {
    name,
    tagline,
    priceLabel,
    priceHint,
    ctaLabel,
    ctaVariant,
    includesLabel,
    features,
    badge,
    href,
    highlighted,
  } = props;
  const price = splitPriceLabel(priceLabel);

  return (
    <article
      className={`landing-plan-card${highlighted ? ' is-highlighted' : ''}`}
    >
      <div className="landing-plan-top">
        <div className="landing-plan-name-row">
          <h3 className="landing-plan-name">{name}</h3>
          {badge ? <span className="landing-plan-badge">{badge}</span> : null}
        </div>
        <p className="landing-plan-tagline">{tagline}</p>
        <p className="landing-plan-price">
          {price.currency ? (
            <span className="landing-plan-currency">{price.currency}</span>
          ) : null}
          {price.amount}
          {price.period ? (
            <span className="landing-plan-period">{price.period}</span>
          ) : null}
        </p>
        {priceHint ? <p className="landing-plan-hint">{priceHint}</p> : null}
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`landing-plan-cta landing-plan-cta--${ctaVariant}`}
      >
        {ctaLabel}
      </a>

      <div className="landing-plan-includes">
        <p className="landing-plan-includes-label">{includesLabel}</p>
        <ul className="landing-plan-features">
          {features.map(feature => (
            <li key={feature}>
              <span className="landing-plan-check" aria-hidden>
                ✓
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
