import {
  COPYRIGHT_TITLE,
  COPYRIGHT_LAST_UPDATED,
  COPYRIGHT_SECTIONS,
  COPYRIGHT_REPORT_MAILTO,
} from '@/domain';

export const metadata = {
  title: COPYRIGHT_TITLE,
  description: 'Copyright and DMCA takedown policy for UNTIL : Countdown & Time Left.',
};

export default function CopyrightPage() {
  return (
    <section style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Copyright & DMCA Policy
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Last updated: {COPYRIGHT_LAST_UPDATED}
      </p>
      <p style={{ marginBottom: '2rem' }}>
        <a href={COPYRIGHT_REPORT_MAILTO} style={{ textDecoration: 'underline' }}>
          Report copyright infringement
        </a>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {COPYRIGHT_SECTIONS.map((s) => (
          <article key={s.id} id={s.id}>
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
