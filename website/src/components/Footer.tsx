import Link from 'next/link';
import { ROUTES, LANDING_COPY, SITE_CONFIG } from '@/domain';

export function Footer() {
  const { footer } = LANDING_COPY;
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--divider)',
        padding:
          '2.5rem 1.5rem calc(2rem + env(safe-area-inset-bottom, 0px))',
        background: 'var(--bg-alt)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            textAlign: 'center',
            paddingBottom: '1.75rem',
            marginBottom: '1.75rem',
            borderBottom: '1px solid var(--divider)',
          }}
        >
          <p
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '0.35rem',
            }}
          >
            {footer.community.title}
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {footer.community.subtitle}{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              ({footer.community.cta.toLowerCase()})
            </span>
          </p>
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
            <span style={{ fontWeight: 600 }}>
              UNTIL&nbsp;:&nbsp;Countdown&nbsp;&amp;&nbsp;Time&nbsp;Left
            </span>
            <span
              style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}
            >
              · {footer.tagline}
            </span>
          </div>
          <nav
            aria-label="Footer"
            style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}
          >
            <Link
              href={ROUTES.terms}
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                padding: '0.65rem 0.75rem',
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {footer.links.terms}
            </Link>
            <Link
              href={ROUTES.privacy}
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                padding: '0.65rem 0.75rem',
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {footer.links.privacy}
            </Link>
            <a
              href={`mailto:${SITE_CONFIG.contactEmail}`}
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                textDecoration: 'none',
                padding: '0.65rem 0.75rem',
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {footer.links.contact}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
