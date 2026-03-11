import Link from 'next/link';
import { ROUTES, LANDING_COPY, SITE_CONFIG } from '@/domain';

export function Footer() {
  const { footer } = LANDING_COPY;
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--divider)',
        padding: '2rem 1.5rem',
        background: 'var(--bg-alt)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Community CTA — ChatPal-style */}
        <div
          style={{
            textAlign: 'center',
            padding: '1.5rem',
            marginBottom: '2rem',
            borderBottom: '1px solid var(--divider)',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            {footer.community.title}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            {footer.community.subtitle}
          </p>
          <span
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: 'var(--divider)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
            }}
          >
            {footer.community.cta}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <span style={{ fontWeight: 600 }}>{footer.appName}</span>
            <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
              — {footer.tagline}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link href={ROUTES.terms} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {footer.links.terms}
            </Link>
            <Link href={ROUTES.privacy} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {footer.links.privacy}
            </Link>
            <a
              href={`mailto:${SITE_CONFIG.contactEmail}`}
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}
            >
              {footer.links.contact}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
