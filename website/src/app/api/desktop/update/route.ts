import { NextResponse } from 'next/server';
import { getLatestDesktopRelease } from '@/lib/desktopRelease';

export const dynamic = 'force-dynamic';

/**
 * Tauri updater endpoint (desktop/src-tauri/tauri.conf.json). Redirects to
 * the signed latest.json of the newest desktop release; 204 means "no update".
 */
export async function GET() {
  const release = await getLatestDesktopRelease();
  if (!release?.updaterJsonUrl) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.redirect(release.updaterJsonUrl);
}
