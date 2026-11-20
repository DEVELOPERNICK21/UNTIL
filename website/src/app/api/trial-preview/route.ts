/**
 * POST /api/trial-preview
 * Server-backed in-app preview start (one per device; survives app storage clear).
 *
 * Env:
 * - UNTIL_TRIAL_API_SECRET or UNTIL_VERIFY_API_SECRET — leave unset for the mobile app.
 *   The app cannot keep a secret, so it sends none; setting this makes every app call 401.
 * - KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV) or Upstash Redis REST vars
 * - UNTIL_TRIAL_PREVIEW_DAYS — default 5
 * - UNTIL_TRIAL_SALT — optional hash salt for device IDs
 */

import { NextResponse } from 'next/server';
import {
  computeTrialEndsAt,
  getOrCreateTrialStart,
} from '../../../lib/trialPreviewStore';

type Body = {
  deviceId?: unknown;
};

export async function POST(request: Request) {
  const secret =
    process.env.UNTIL_TRIAL_API_SECRET?.trim() ||
    process.env.UNTIL_VERIFY_API_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const deviceId = typeof body.deviceId === 'string' ? body.deviceId.trim() : '';
  if (!deviceId) {
    return NextResponse.json(
      { ok: false, error: 'deviceId required' },
      { status: 400 }
    );
  }
  // Real ids are a UUID or a short hex string. Capping the length and the characters keeps the store
  // from being fed arbitrary large values by an unauthenticated caller.
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(deviceId)) {
    return NextResponse.json(
      { ok: false, error: 'deviceId is not valid' },
      { status: 400 }
    );
  }

  const nowMs = Date.now();
  try {
    const record = await getOrCreateTrialStart(deviceId, nowMs);
    const trialEndsAt = computeTrialEndsAt(record.trialStartMs);
    const trialActive = nowMs <= trialEndsAt;

    return NextResponse.json({
      ok: true,
      trialStartMs: record.trialStartMs,
      trialEndsAt,
      trialActive,
    });
  } catch (e) {
    // The storage error can name the KV host and credentials' scope; keep it in the log only.
    console.error('trial-preview:', e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: 'Storage error' }, { status: 503 });
  }
}
