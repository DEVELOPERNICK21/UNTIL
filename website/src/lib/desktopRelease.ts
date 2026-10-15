/**
 * Newest published UNTIL desktop build on GitHub Releases. The repo also may
 * hold phone releases, so this filters on the `desktop-v*` tag instead of
 * trusting GitHub's "latest". Cached for 10 minutes.
 */

import { SITE_CONFIG } from '@/domain/config';

const TAG_PREFIX = 'desktop-v';
const REVALIDATE_SECONDS = 600;

interface GithubAsset {
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  assets: GithubAsset[];
}

export interface DesktopRelease {
  version: string;
  macUrl: string | null;
  windowsUrl: string | null;
  updaterJsonUrl: string | null;
}

export async function getLatestDesktopRelease(): Promise<DesktopRelease | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${SITE_CONFIG.githubRepo}/releases?per_page=30`,
      {
        headers: { Accept: 'application/vnd.github+json' },
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );
    if (!res.ok) return null;
    const releases = (await res.json()) as GithubRelease[];
    const release = releases.find(
      r => !r.draft && !r.prerelease && r.tag_name.startsWith(TAG_PREFIX),
    );
    if (!release) return null;

    const find = (test: (name: string) => boolean) =>
      release.assets.find(a => test(a.name))?.browser_download_url ?? null;

    return {
      version: release.tag_name.slice(TAG_PREFIX.length),
      macUrl: find(name => name.endsWith('.dmg')),
      windowsUrl: find(name => name.endsWith('-setup.exe')),
      updaterJsonUrl: find(name => name === 'latest.json'),
    };
  } catch {
    return null;
  }
}
