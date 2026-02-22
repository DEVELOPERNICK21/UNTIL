'use client';

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
        padding: '1rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href={ROUTES.home} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '1.25rem' }}>
          {SITE_CONFIG.appName}
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href={ROUTES.terms} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Terms
          </Link>
          <Link href={ROUTES.privacy} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Privacy
          </Link>
        </nav>
      </div>
    </header>
  );
}
