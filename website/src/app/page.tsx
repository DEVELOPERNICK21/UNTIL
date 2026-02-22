import { PhoneMockup } from '@/components/PhoneMockup';
import { AppScreenPreview } from '@/components/AppScreenPreview';
import { LANDING_COPY, SITE_CONFIG } from '@/domain';

export default function HomePage() {
  const { hero, features, cta } = LANDING_COPY;

  return (
    <>
      <section style={{ paddingTop: '3rem', paddingBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 600, marginBottom: '0.5rem' }}>
          {hero.title}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 480, margin: '0 auto 2rem' }}>
          {hero.subtitle}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <a
            href={SITE_CONFIG.appStoreUrl}
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
            App Store
          </a>
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
            Google Play
          </a>
        </div>
        <PhoneMockup>
          <AppScreenPreview />
        </PhoneMockup>
      </section>

      <section style={{ borderTop: '1px solid var(--divider)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'center' }}>
          What you get
        </h2>
        <ul style={{ listStyle: 'none', display: 'grid', gap: '1.5rem', maxWidth: 640, margin: '0 auto' }}>
          {features.map((f) => (
            <li
              key={f.title}
              style={{
                padding: '1rem 1.25rem',
                background: 'var(--bg-alt)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--divider)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.35rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{f.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ textAlign: 'center', borderTop: '1px solid var(--divider)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>{cta.title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{cta.subtitle}</p>
        <a
          href={SITE_CONFIG.appStoreUrl}
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
          {LANDING_COPY.hero.cta}
        </a>
      </section>
    </>
  );
}
