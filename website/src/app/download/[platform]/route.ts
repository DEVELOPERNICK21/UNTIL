import { NextResponse } from 'next/server';
import { getLatestDesktopRelease } from '@/lib/desktopRelease';

export const dynamic = 'force-dynamic';

/** /download/mac and /download/windows: redirect to the newest installer. */
export async function GET(
  request: Request,
  { params }: { params: { platform: string } },
) {
  const release = await getLatestDesktopRelease();
  const url =
    params.platform === 'mac'
      ? release?.macUrl
      : params.platform === 'windows'
        ? release?.windowsUrl
        : null;

  if (!url) {
    return NextResponse.redirect(new URL('/#desktop', request.url));
  }
  return NextResponse.redirect(url);
}
