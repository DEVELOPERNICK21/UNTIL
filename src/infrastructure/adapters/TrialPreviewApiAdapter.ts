/**
 * Syncs in-app preview start with backend (Vercel KV per device).
 */

import type {
  ITrialPreviewService,
  TrialPreviewSyncResult,
} from '../../domain/ports/ITrialPreviewService';
import { recordCrashError } from '../../services/analytics';

const TRIAL_PREVIEW_URL =
  process.env.UNTIL_TRIAL_PREVIEW_URL ??
  'https://developernick1-until.vercel.app/api/trial-preview';

// No shared secret: anything shipped in the app bundle is public.
export class TrialPreviewApiAdapter implements ITrialPreviewService {
  async sync(deviceId: string): Promise<TrialPreviewSyncResult> {
    const id = deviceId?.trim();
    if (!id) {
      return { ok: false, error: 'Missing device id' };
    }

    try {
      const res = await fetch(TRIAL_PREVIEW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ deviceId: id }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        trialStartMs?: number;
        trialEndsAt?: number;
        trialActive?: boolean;
        error?: string;
      };

      if (!res.ok || data.ok !== true) {
        return {
          ok: false,
          error: data.error ?? `Trial sync failed (${res.status})`,
        };
      }

      if (
        typeof data.trialStartMs !== 'number' ||
        typeof data.trialEndsAt !== 'number'
      ) {
        return { ok: false, error: 'Invalid trial sync response' };
      }

      return {
        ok: true,
        trialStartMs: data.trialStartMs,
        trialEndsAt: data.trialEndsAt,
        trialActive: data.trialActive === true,
      };
    } catch (e) {
      recordCrashError(e, 'TrialPreviewApiAdapter.sync');
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Network error',
      };
    }
  }
}
