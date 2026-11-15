import type { Metadata } from 'next';
import './globals.css';
import { SITE_CONFIG } from '@/domain';

const DESCRIPTION =
  'See your life in weeks, the year so far and the time left today, on your Home Screen, Lock Screen and watch. Widgets, Ember, countdowns and daily tasks for iPhone and Android.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.baseUrl),
  title: {
    default: 'UNTIL: Life in Weeks, Year Progress & Time Left Widgets',
    template: '%s · UNTIL',
  },
  description: DESCRIPTION,
  applicationName: 'UNTIL',
  keywords: [
    'life in weeks',
    'time left widget',
    'year progress',
    'life progress',
    'countdown widget',
    'memento mori',
    'days until',
    'Apple Watch',
    'Lock Screen widget',
  ],
  alternates: { canonical: '/' },
  // iPhone Safari offers the app in a banner at the top of the page.
  itunes: { appId: SITE_CONFIG.appStoreId },
  openGraph: {
    type: 'website',
    siteName: 'UNTIL',
    title: 'UNTIL: Life in Weeks, Year Progress & Time Left',
    description: DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNTIL: Life in Weeks, Year Progress & Time Left',
    description: DESCRIPTION,
  },
  other: {
    'theme-color': '#0e0e10',
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
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
