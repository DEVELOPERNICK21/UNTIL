import { NextResponse } from 'next/server';
import { getLatestDesktopRelease } from '@/lib/desktopRelease';

export const dynamic = 'force-dynamic';

/** /download/mac and /download/windows: redirect to the newest installer. */
export async function GET(
  request: Request,
  // Next 15: route params arrive as a Promise.
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const release = await getLatestDesktopRelease();
  const url =
    platform === 'mac'
      ? release?.macUrl
      : platform === 'windows'
        ? release?.windowsUrl
        : null;

  if (!url) {
    return NextResponse.redirect(new URL('/#desktop', request.url));
  }
  // The installer link comes from GitHub's API. Only ever redirect to GitHub, never to another host.
  try {
    const host = new URL(url).hostname;
    if (host !== 'github.com' && !host.endsWith('.githubusercontent.com')) {
      return NextResponse.redirect(new URL('/#desktop', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/#desktop', request.url));
  }
  return NextResponse.redirect(url);
}
