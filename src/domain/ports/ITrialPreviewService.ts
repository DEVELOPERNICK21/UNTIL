/**
 * Server-backed in-app preview sync (anti-reset on storage clear).
 */

export type TrialPreviewSyncResult =
  | {
      ok: true;
      trialStartMs: number;
      trialEndsAt: number;
      trialActive: boolean;
    }
  | {
      ok: false;
      error?: string;
    };

export interface ITrialPreviewService {
  sync(deviceId: string): Promise<TrialPreviewSyncResult>;
}
