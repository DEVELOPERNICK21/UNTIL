import Link from 'next/link';
import { ROUTES, SITE_CONFIG } from '@/domain';

export function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--divider)',
        padding:
          'calc(1rem + env(safe-area-inset-top, 0px)) 1.5rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <Link
          href={ROUTES.home}
          style={{
            textDecoration: 'none',
            color: 'var(--text)',
            fontWeight: 600,
            fontSize: '1.1rem',
            lineHeight: 1.2,
          }}
        >
          UNTIL
        </Link>
        <nav aria-label="Legal" style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href={ROUTES.terms}
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              padding: '0.65rem 0.75rem',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Terms
          </Link>
          <Link
            href={ROUTES.privacy}
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              padding: '0.65rem 0.75rem',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Privacy
          </Link>
        </nav>
      </div>
    </header>
  );
}
