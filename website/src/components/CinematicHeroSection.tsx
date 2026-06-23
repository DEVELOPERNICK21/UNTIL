'use client';

import { CinematicHero } from '@/components/ui/cinematic-hero';
import { LANDING_COPY, SITE_CONFIG } from '@/domain';

export function CinematicHeroSection() {
  const { cinematicHero, pricingCta } = LANDING_COPY;

  return (
    <CinematicHero
      brandName={cinematicHero.brandName}
      tagline1={cinematicHero.tagline1}
      tagline2={cinematicHero.tagline2}
      cardHeading={cinematicHero.cardHeading}
      cardDescription={cinematicHero.cardDescription}
      metricValue={cinematicHero.metricValue}
      metricLabel={cinematicHero.metricLabel}
      ctaHeading={cinematicHero.ctaHeading}
      ctaDescription={cinematicHero.ctaDescription}
      playStoreUrl={SITE_CONFIG.playStoreUrl}
      appStoreUrl={SITE_CONFIG.appStoreUrl}
      iosComingSoon={pricingCta.iosComingSoon}
    />
  );
}
