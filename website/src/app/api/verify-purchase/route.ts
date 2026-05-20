/**
 * POST /api/verify-purchase
 * Verifies Google Play purchase tokens when service account is configured.
 *
 * Env:
 * - UNTIL_VERIFY_API_SECRET — Bearer token the app must send
 * - GOOGLE_PLAY_PACKAGE_NAME — default app.until.time
 * - GOOGLE_PLAY_SERVICE_ACCOUNT_JSON — full JSON key (Vercel env, not committed)
 */

import { NextResponse } from 'next/server';

type Body = {
  productId?: string;
  purchaseToken?: string;
  packageName?: string;
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

    const isSubscription = productId.includes('subscription');
    const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases`;
    const url = isSubscription
      ? `${base}/subscriptions/${productId}/tokens/${encodeURIComponent(purchaseToken)}`
      : `${base}/products/${productId}/tokens/${encodeURIComponent(purchaseToken)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token.token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || `Google API ${res.status}` };
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
    const message = e instanceof Error ? e.message : 'Verification error';
    return { ok: false, error: message };
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

  const productId = body.productId?.trim();
  const purchaseToken = body.purchaseToken?.trim();
  const packageName =
    body.packageName?.trim() ??
    process.env.GOOGLE_PLAY_PACKAGE_NAME ??
    'app.until.time';

  if (!productId || !purchaseToken) {
    return NextResponse.json(
      { valid: false, error: 'productId and purchaseToken required' },
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
