/**
 * Pure URL building and parsing for browser-based sign-in.
 * Google: loopback redirect + PKCE (RFC 8252). Apple: the website page runs
 * Sign in with Apple and hands the id token back via an until-desktop:// link.
 */

export type CallbackResult<T> =
  | ({ ok: true } & T)
  | { ok: false; reason: 'state_mismatch' | 'cancelled' };

export function googleAuthUrl(input: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    code_challenge: input.codeChallenge,
    code_challenge_method: 'S256',
    state: input.state,
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function parseLoopbackCallback(
  url: string,
  expectedState: string,
): CallbackResult<{ code: string }> {
  const params = new URL(url).searchParams;
  if (params.get('state') !== expectedState) {
    return { ok: false, reason: 'state_mismatch' };
  }
  const code = params.get('code');
  if (!code) return { ok: false, reason: 'cancelled' };
  return { ok: true, code };
}

export function appleStartUrl(input: {
  pageUrl: string;
  state: string;
  hashedNonce: string;
}): string {
  const params = new URLSearchParams({
    provider: 'apple',
    state: input.state,
    nonce: input.hashedNonce,
  });
  return `${input.pageUrl}?${params.toString()}`;
}

export function parseAppleDeepLink(
  url: string,
  expectedState: string,
): CallbackResult<{ idToken: string }> {
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  const params = new URLSearchParams(query);
  if (params.get('state') !== expectedState) {
    return { ok: false, reason: 'state_mismatch' };
  }
  const idToken = params.get('id_token');
  if (!idToken) return { ok: false, reason: 'cancelled' };
  return { ok: true, idToken };
}
