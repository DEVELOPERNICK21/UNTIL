import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ASO Studio · UNTIL',
  description: 'Internal store screenshot and listing asset tool.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AsoStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg)]">
      {children}
    </main>
  );
}
