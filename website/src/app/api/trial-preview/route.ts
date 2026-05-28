/**
 * POST /api/trial-preview
 * Server-backed in-app preview start (one per device; survives app storage clear).
 *
 * Env:
 * - UNTIL_TRIAL_API_SECRET or UNTIL_VERIFY_API_SECRET — Bearer token the app must send
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
  deviceId?: string;
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

  const deviceId = body.deviceId?.trim();
  if (!deviceId) {
    return NextResponse.json(
      { ok: false, error: 'deviceId required' },
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
    const message = e instanceof Error ? e.message : 'Storage error';
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
