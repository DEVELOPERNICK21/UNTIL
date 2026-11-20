/**
 * POST /api/verify-purchase
 * Verifies Google Play purchase tokens when service account is configured.
 *
 * Env:
 * - UNTIL_VERIFY_API_SECRET — only for server-to-server callers. The mobile app sends no
 *   secret (it cannot keep one), so leave unset if the app calls this route.
 * - GOOGLE_PLAY_PACKAGE_NAME — default app.until.time
 * - GOOGLE_PLAY_SERVICE_ACCOUNT_JSON — full JSON key (Vercel env, not committed)
 */

import { NextResponse } from 'next/server';
import {
  DEFAULT_PACKAGE_NAME,
  buildPurchaseLookupUrl,
  isSubscriptionProduct,
  isValidProductId,
  isValidPurchaseToken,
} from '@/lib/playPurchase';

type Body = {
  productId?: unknown;
  purchaseToken?: unknown;
  packageName?: unknown;
};

async function verifyWithGooglePlay(
  packageName: string,
  productId: string,
  purchaseToken: string
): Promise<{ ok: boolean; error?: string }> {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) {
    return { ok: true };
  }

  try {
    const creds = JSON.parse(raw) as {
      client_email: string;
      private_key: string;
    };

    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) {
      return { ok: false, error: 'Failed to obtain Google access token' };
    }

    const isSubscription = isSubscriptionProduct(productId);
    // Throws on anything that is not a plain product id / token / package name, and fixes the host.
    const url = buildPurchaseLookupUrl({ packageName, productId, purchaseToken });

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token.token}` },
      redirect: 'error', // never send the Google token to a redirect target
      cache: 'no-store',
    });

    if (!res.ok) {
      // Google's error body can name the project and service account: log it here, do not return it.
      console.error('verify-purchase: Google Play API answered', res.status);
      return { ok: false, error: 'Google Play could not verify this purchase' };
    }

    const json = (await res.json()) as {
      purchaseState?: number;
      paymentState?: number;
    };

    if (isSubscription) {
      const paymentOk = json.paymentState === 1 || json.paymentState === 2;
      return paymentOk ? { ok: true } : { ok: false, error: 'Subscription not active' };
    }

    const purchased = json.purchaseState === 0;
    return purchased ? { ok: true } : { ok: false, error: 'Product not purchased' };
  } catch (e) {
    // Keep the detail in the server log; the caller only needs to know it failed.
    console.error('verify-purchase:', e instanceof Error ? e.message : e);
    return { ok: false, error: 'Verification error' };
  }
}

export async function POST(request: Request) {
  const secret = process.env.UNTIL_VERIFY_API_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ valid: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ valid: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const productId = typeof body.productId === 'string' ? body.productId.trim() : '';
  const purchaseToken =
    typeof body.purchaseToken === 'string' ? body.purchaseToken.trim() : '';
  if (!productId || !purchaseToken) {
    return NextResponse.json(
      { valid: false, error: 'productId and purchaseToken required' },
      { status: 400 }
    );
  }
  if (!isValidProductId(productId) || !isValidPurchaseToken(purchaseToken)) {
    return NextResponse.json(
      { valid: false, error: 'Invalid productId or purchaseToken' },
      { status: 400 }
    );
  }

  // The package is ours, not the caller's. The app sends it, so accept a match and refuse anything else
  // rather than let a caller pick which app's purchases the server's Google token is used on.
  const packageName =
    process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || DEFAULT_PACKAGE_NAME;
  if (typeof body.packageName === 'string' && body.packageName.trim() !== packageName) {
    return NextResponse.json(
      { valid: false, error: 'Unknown package' },
      { status: 400 }
    );
  }

  const hasGoogleCreds = Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim());
  if (!hasGoogleCreds) {
    return NextResponse.json({
      valid: true,
      serverVerified: false,
      warning: 'Google Play verification not configured on server',
    });
  }

  const result = await verifyWithGooglePlay(packageName, productId, purchaseToken);
  if (!result.ok) {
    return NextResponse.json(
      { valid: false, serverVerified: true, error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({ valid: true, serverVerified: true });
}
