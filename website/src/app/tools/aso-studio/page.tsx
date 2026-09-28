'use client';

import dynamic from 'next/dynamic';

const AsoStudioApp = dynamic(
  () =>
    import('@/features/aso-studio/components/AsoStudioApp').then(
      (m) => m.AsoStudioApp,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-secondary)]">
        Loading ASO Studio…
      </div>
    ),
  },
);

export default function AsoStudioPage() {
  return <AsoStudioApp />;
}
