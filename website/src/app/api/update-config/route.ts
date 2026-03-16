// app/api/update-config/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.0.0',
    minimum_supported_version: '1.0.0',
    force_update: false,
    store_url_android:
      'https://play.google.com/store/apps/details?id=app.until.time',
    store_url_ios: 'https://apps.apple.com/app/id123456',
  });
}
