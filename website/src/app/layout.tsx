import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SITE_CONFIG } from '@/domain';

export const metadata: Metadata = {
  title: `${SITE_CONFIG.appName} — ${SITE_CONFIG.tagline}`,
  description: 'See your time. Day, month, year, life. One app. No clutter.',
  openGraph: {
    title: SITE_CONFIG.appName,
    description: SITE_CONFIG.tagline,
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
