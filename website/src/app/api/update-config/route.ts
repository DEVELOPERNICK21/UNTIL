// app/api/update-config/route.ts
import { NextResponse } from 'next/server';
import { APP_UPDATE, type PlatformUpdate } from '@/domain/appUpdate';

export const dynamic = 'force-static';

/** One platform's section as the app reads it; omitted entirely while prompts are off for it. */
function section(update: PlatformUpdate) {
  if (update.latestBuild == null) return undefined;
  return {
    latest_build: update.latestBuild,
    minimum_build: update.minimumBuild,
    version_name: update.versionName ?? undefined,
    store_url: update.storeUrl ?? undefined,
    notes: update.notes,
  };
}

export function GET() {
  return NextResponse.json(
    {
      schema: 2,
      android: section(APP_UPDATE.android),
      ios: section(APP_UPDATE.ios),
      // Builds that shipped before schema 2 read these two fields; "1" means "nothing to say", so
      // they stay quiet instead of comparing an Android build number with an iOS one.
      latest_version: '1',
      minimum_supported_version: '1',
      force_update: false,
    },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
  );
}
