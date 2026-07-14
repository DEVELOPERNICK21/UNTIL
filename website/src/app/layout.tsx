import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SITE_CONFIG } from '@/domain';

export const metadata: Metadata = {
  title: `${SITE_CONFIG.appName} — ${SITE_CONFIG.tagline}`,
  description:
    'See your time across day, month, year, and life. Ember companion, home widgets, Wear OS Day %, deadlines, tasks, and share snapshots.',
  openGraph: {
    title: SITE_CONFIG.appName,
    description:
      'Time awareness with Ember, widgets, Wear OS Day %, deadlines, counters, tasks, and shareable snapshots.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
