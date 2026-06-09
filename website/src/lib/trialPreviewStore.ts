import { createHash } from 'crypto';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TRIAL_DAYS = 5;

export type TrialPreviewRecord = {
  trialStartMs: number;
};

export function getTrialPreviewDays(): number {
  const raw = process.env.UNTIL_TRIAL_PREVIEW_DAYS;
  const parsed = raw ? parseInt(raw, 10) : DEFAULT_TRIAL_DAYS;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TRIAL_DAYS;
}

export function hashDeviceId(deviceId: string): string {
  const salt =
    process.env.UNTIL_TRIAL_SALT?.trim() || 'until-trial-preview-v1';
  return createHash('sha256')
    .update(`${salt}:${deviceId.trim()}`)
    .digest('hex');
}

function kvConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL?.trim() ||
      process.env.UPSTASH_REDIS_REST_URL?.trim()
  );
}

async function getKvClient(): Promise<{
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<unknown>;
} | null> {
  if (!kvConfigured()) return null;
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

export function computeTrialEndsAt(trialStartMs: number): number {
  return trialStartMs + getTrialPreviewDays() * ONE_DAY_MS;
}

export async function getOrCreateTrialStart(
  deviceId: string,
  nowMs: number
): Promise<TrialPreviewRecord> {
  const kv = await getKvClient();
  if (!kv) {
    throw new Error(
      'Trial preview storage not configured (KV_REST_API_URL / UPSTASH_REDIS_REST_URL)'
    );
  }

  const key = `trial-preview:${hashDeviceId(deviceId)}`;
  const existing = await kv.get<TrialPreviewRecord>(key);
  if (existing?.trialStartMs && existing.trialStartMs > 0) {
    return existing;
  }

  const record: TrialPreviewRecord = { trialStartMs: nowMs };
  await kv.set(key, record);
  return record;
}
