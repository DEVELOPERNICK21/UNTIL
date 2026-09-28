// app/api/update-config/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Use Android versionCode (Play Console "version code") / iOS build number,
  // not versionName. FORCE / optional prompts compare against these integers.
  //
  // PAUSED (2026-09-20): no force or optional update prompts for a while.
  // When ready to require an update again, set e.g.:
  //   latest_version: '15',
  //   minimum_supported_version: '15',  // force anyone below this
  //   force_update: true,
  // then redeploy the website.
  return NextResponse.json({
    latest_version: '1',
    minimum_supported_version: '1',
    force_update: false,
    store_url_android:
      'https://play.google.com/store/apps/details?id=app.until.time',
    store_url_ios: 'https://apps.apple.com/app/id123456',
  });
}
