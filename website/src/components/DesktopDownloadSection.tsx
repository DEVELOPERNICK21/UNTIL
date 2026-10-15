import { LANDING_COPY } from '@/domain';
import { getLatestDesktopRelease } from '@/lib/desktopRelease';
import { DesktopDownloadButtons } from './DesktopDownloadButtons';

export async function DesktopDownloadSection() {
  const release = await getLatestDesktopRelease();
  const copy = LANDING_COPY.desktop;

  return (
    <section id="desktop" className="desktop-download">
      <h2 className="desktop-download-title">{copy.title}</h2>
      <p className="desktop-download-subtitle">{copy.subtitle}</p>
      <DesktopDownloadButtons
        hasMac={Boolean(release?.macUrl)}
        hasWindows={Boolean(release?.windowsUrl)}
        version={release?.version ?? null}
      />
    </section>
  );
}
