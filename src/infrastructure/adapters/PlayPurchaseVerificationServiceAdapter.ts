/**
 * Verifies Play purchases via backend (Google Play Developer API when configured).
 */

import type {
  IPlayPurchaseVerificationService,
  PurchaseVerificationRequest,
  PurchaseVerificationResult,
} from '../../domain/ports/IPlayPurchaseVerificationService';
import { recordCrashError } from '../../services/analytics';

const VERIFY_URL =
  process.env.UNTIL_VERIFY_PURCHASE_URL ??
  'https://developernick1-until.vercel.app/api/verify-purchase';

// No shared secret: anything shipped in the app bundle is public.
export class PlayPurchaseVerificationServiceAdapter
  implements IPlayPurchaseVerificationService
{
  async verify(
    request: PurchaseVerificationRequest
  ): Promise<PurchaseVerificationResult> {
    if (!request.purchaseToken?.trim()) {
      return { valid: false, error: 'Missing purchase token' };
    }

    try {
      const res = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = (await res.json()) as {
        valid?: boolean;
        serverVerified?: boolean;
        error?: string;
      };

      if (!res.ok) {
        return {
          valid: false,
          error: data.error ?? `Verification failed (${res.status})`,
        };
      }

      return {
        valid: data.valid === true,
        serverVerified: data.serverVerified === true,
        error: data.error,
      };
    } catch (e) {
      recordCrashError(e, 'PlayPurchaseVerificationServiceAdapter.verify');
      return {
        valid: false,
        error: e instanceof Error ? e.message : 'Network error',
      };
    }
  }
}
