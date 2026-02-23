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
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
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
    </footer>
  );
}
