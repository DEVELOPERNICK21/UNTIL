import { PRIVACY_TITLE, PRIVACY_LAST_UPDATED, PRIVACY_SECTIONS } from '@/domain';

export const metadata = {
  title: PRIVACY_TITLE,
  description: 'Privacy Policy for Until: Days left app and website.',
};

function renderBody(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

export default function PrivacyPage() {
  return (
    <section style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Privacy Policy
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Last updated: {PRIVACY_LAST_UPDATED}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {PRIVACY_SECTIONS.map((s) => (
          <article key={s.id}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {s.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
              {renderBody(s.body)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
