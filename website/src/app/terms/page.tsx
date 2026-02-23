import { TERMS_TITLE, TERMS_LAST_UPDATED, TERMS_SECTIONS } from '@/domain';

export const metadata = {
  title: TERMS_TITLE,
  description: 'Terms of Service for Until: Days left app and website.',
};

export default function TermsPage() {
  return (
    <section style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Terms of Service
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Last updated: {TERMS_LAST_UPDATED}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {TERMS_SECTIONS.map((s) => (
          <article key={s.id}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {s.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
              {s.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
