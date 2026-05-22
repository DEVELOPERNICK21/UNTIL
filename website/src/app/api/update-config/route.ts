// app/api/update-config/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Use Android versionCode (Play Console "version code"), not versionName.
  // Production is 7 (1.0). Bump latest_version to "8" only after 8 (1.1) is live on Play.
  return NextResponse.json({
    latest_version: '9',
    minimum_supported_version: '9',
    force_update: false,
    store_url_android:
      'https://play.google.com/store/apps/details?id=app.until.time',
    store_url_ios: 'https://apps.apple.com/app/id123456',
  });
}
