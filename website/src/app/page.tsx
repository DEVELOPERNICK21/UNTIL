import { HeroScreenshotShowcase } from '@/components/HeroScreenshotShowcase';
import { AppScreenshots } from '@/components/AppScreenshots';
import { LANDING_COPY, SITE_CONFIG } from '@/domain';

export default function HomePage() {
  const {
    introPriceLine,
    hero,
    valueProps,
    features,
    whyChoose,
    testimonials,
    faq,
    pricingCta,
    cta,
  } = LANDING_COPY;
  const { pricing } = SITE_CONFIG;

  return (
    <>
      {/* Intro price line — limited time highlighted */}
      <section style={{ paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
        <p className="landing-intro-line">
          <span className="landing-offer-badge">Limited time</span>
          <span>Premium ₹99 (was ₹299). One-time, no subscription. iPhone &amp; Android.</span>
        </p>
      </section>

      {/* Hero */}
      <section
        style={{
          paddingTop: '0.5rem',
          paddingBottom: '2rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}
        >
          {hero.title}
        </h1>
        <p
          style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.2rem)',
            color: 'var(--text)',
            maxWidth: 520,
            margin: '0 auto 0.5rem',
          }}
        >
          {hero.headline}
        </p>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            maxWidth: 480,
            margin: '0 auto 2rem',
          }}
        >
          {hero.subtitle}
        </p>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '2rem',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'var(--divider)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              cursor: 'default',
            }}
          >
            App Store — Coming soon
          </span>
          <a
            href={SITE_CONFIG.playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'var(--text)',
              color: 'var(--bg)',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Get on Google Play
          </a>
        </div>
        <HeroScreenshotShowcase />
      </section>

      {/* Value props — "That's why Until exists" (ChatPal-style) */}
      <section style={{ borderTop: '1px solid var(--divider)' }}>
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {valueProps.tagline}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            maxWidth: 720,
            margin: '0 auto',
          }}
        >
          {valueProps.items.map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                }}
              >
                {item.label}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* App screenshots — iOS & Android */}
      <section style={{ borderTop: '1px solid var(--divider)' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '0.35rem',
            textAlign: 'center',
          }}
        >
          See the app
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            marginBottom: '1.5rem',
          }}
        >
          Day, month, year, and life progress. Widgets, countdowns, and counters
          on iPhone and Android.
        </p>
        <AppScreenshots />
      </section>

      {/* Features — card grid */}
      <section style={{ borderTop: '1px solid var(--divider)' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          What you get
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem',
            maxWidth: 900,
            margin: '0 auto',
          }}
        >
          {features.map(f => (
            <div key={f.title} className="landing-feature-card">
              <div className="landing-feature-category">{f.category}</div>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why people choose Until */}
      <section style={{ borderTop: '1px solid var(--divider)' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '0.35rem',
            textAlign: 'center',
          }}
        >
          {whyChoose.title}
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            marginBottom: '1.5rem',
          }}
        >
          {whyChoose.subtitle}
        </p>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {whyChoose.items.map(item => (
            <div key={item.title} className="landing-why-item">
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '0.25rem',
                }}
              >
                {item.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials — social proof (ChatPal-style) */}
      <section style={{ borderTop: '1px solid var(--divider)' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '0.35rem',
            textAlign: 'center',
          }}
        >
          {testimonials.title}
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}
        >
          Trusted by people who care about time
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
            maxWidth: 960,
            margin: '0 auto',
          }}
        >
          {testimonials.items.map((t, i) => (
            <div key={i} className="landing-testimonial-card">
              <div className="landing-testimonial-stars" aria-hidden>
                {'★'.repeat(t.stars)}
              </div>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="landing-testimonial-meta">
                <strong style={{ color: 'var(--text)' }}>{t.author}</strong> ·{' '}
                {t.role}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ — reduces friction, answers common questions */}
      <section style={{ borderTop: '1px solid var(--divider)' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          {faq.title}
        </h2>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {faq.items.map((item, i) => (
            <details
              key={i}
              style={{
                borderBottom: '1px solid var(--divider)',
                padding: '1rem 0',
              }}
            >
              <summary
                style={{
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                {item.question}
              </summary>
              <p
                style={{
                  marginTop: '0.75rem',
                  marginLeft: '1.25rem',
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <section style={{ borderTop: '1px solid var(--divider)' }}>
        <div className="landing-pricing-box">
          <span className="landing-offer-badge">Limited time offer</span>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            {pricingCta.title}
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              marginBottom: '1.25rem',
            }}
          >
            {pricingCta.subtitle}
          </p>
          <ul className="landing-pricing-checkmarks">
            {pricingCta.checkmarks.map(line => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {pricing.price && (
            <p style={{ marginBottom: '0.5rem' }}>
              <span className="landing-price-badge">{pricing.price}</span>
              {pricing.wasPrice ? (
                <span className="landing-price-was">{pricing.wasPrice}</span>
              ) : null}
              {pricing.savePercent > 0 ? (
                <span className="landing-price-save">
                  Save {pricing.savePercent}%
                </span>
              ) : null}
            </p>
          )}
          <p
            style={{
              fontSize: '0.9rem',
              marginBottom: '1rem',
            }}
          >
            <span className="landing-limited-time-text">{pricing.currencyNote}</span>
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: 'var(--divider)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                cursor: 'default',
              }}
            >
              {pricingCta.iosComingSoon}
            </span>
            <a
              href={SITE_CONFIG.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: 'var(--text)',
                color: 'var(--bg)',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {pricingCta.ctaLabelAndroid}
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        style={{ textAlign: 'center', borderTop: '1px solid var(--divider)' }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}
        >
          {cta.title}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {cta.subtitle}
        </p>
        <a
          href={SITE_CONFIG.playStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: 'var(--text)',
            color: 'var(--bg)',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Get on Google Play
        </a>
      </section>
    </>
  );
}
