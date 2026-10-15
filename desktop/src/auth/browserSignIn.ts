/**
 * Sign in through the system browser (RFC 8252); the webview never shows a
 * provider page.
 * - Google: Rust opens a one-shot loopback listener, the browser redirects to
 *   it with a code, Rust exchanges the code (PKCE) for an id token.
 * - Apple: the website page runs Sign in with Apple with our hashed nonce and
 *   returns the id token through an until-desktop:// link.
 * Both end in signInWithCredential on the Firebase JS SDK.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { openUrl } from '@tauri-apps/plugin-opener';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  APPLE_SIGN_IN_PAGE,
  BROWSER_SIGN_IN_TIMEOUT_MS,
  GOOGLE_DESKTOP_CLIENT_ID,
  GOOGLE_DESKTOP_CLIENT_SECRET,
} from '../config';
import {
  appleStartUrl,
  googleAuthUrl,
  parseAppleDeepLink,
  parseLoopbackCallback,
} from './oauthUrls';
import { pkceChallenge, randomToken, sha256Hex } from './crypto';

export type SignInFailure = 'cancelled' | 'not_configured' | 'failed';

export class SignInError extends Error {
  constructor(readonly reason: SignInFailure, detail?: string) {
    super(detail ?? reason);
  }
}

let cancelWaiting: (() => void) | null = null;

/** Stops waiting for the browser; the pending sign-in rejects as cancelled. */
export function cancelBrowserSignIn(): void {
  cancelWaiting?.();
}

/** Resolves with the first value `accept` returns; rejects as cancelled on timeout. */
function waitForBrowser<T>(
  subscribe: (handle: (value: string) => void) => Promise<() => void>,
  accept: (value: string) => T | undefined,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let unlisten: (() => void) | undefined;
    const done = (fn: () => void) => {
      clearTimeout(timer);
      unlisten?.();
      cancelWaiting = null;
      fn();
    };
    cancelWaiting = () => done(() => reject(new SignInError('cancelled')));
    const timer = setTimeout(
      () => done(() => reject(new SignInError('cancelled', 'browser timed out'))),
      BROWSER_SIGN_IN_TIMEOUT_MS,
    );
    subscribe(value => {
      try {
        const result = accept(value);
        if (result !== undefined) done(() => resolve(result));
      } catch (e) {
        done(() => reject(e));
      }
    }).then(
      fn => {
        unlisten = fn;
      },
      e => done(() => reject(e)),
    );
  });
}

export async function signInWithGoogle(): Promise<UserCredential> {
  if (!GOOGLE_DESKTOP_CLIENT_ID || !GOOGLE_DESKTOP_CLIENT_SECRET) {
    throw new SignInError('not_configured', 'Google desktop client is not set');
  }
  const state = randomToken();
  const verifier = randomToken();
  const port = await invoke<number>('oauth_loopback_start');
  const redirectUri = `http://127.0.0.1:${port}`;

  const callback = waitForBrowser(
    handle => listen<string>('oauth-callback', e => handle(e.payload)),
    url => {
      const parsed = parseLoopbackCallback(url, state);
      if (parsed.ok) return parsed.code;
      if (parsed.reason === 'cancelled') throw new SignInError('cancelled');
      return undefined;
    },
  );
  await openUrl(
    googleAuthUrl({
      clientId: GOOGLE_DESKTOP_CLIENT_ID,
      redirectUri,
      codeChallenge: await pkceChallenge(verifier),
      state,
    }),
  );
  const code = await callback;

  const idToken = await invoke<string>('google_exchange_code', {
    clientId: GOOGLE_DESKTOP_CLIENT_ID,
    clientSecret: GOOGLE_DESKTOP_CLIENT_SECRET,
    code,
    codeVerifier: verifier,
    redirectUri,
  }).catch(e => {
    throw new SignInError('failed', String(e));
  });
  return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}

export async function signInWithApple(): Promise<UserCredential> {
  const state = randomToken();
  const rawNonce = randomToken();

  const token = waitForBrowser(
    handle => onOpenUrl(urls => urls.forEach(handle)),
    url => {
      const parsed = parseAppleDeepLink(url, state);
      if (parsed.ok) return parsed.idToken;
      if (parsed.reason === 'cancelled') throw new SignInError('cancelled');
      return undefined;
    },
  );
  await openUrl(
    appleStartUrl({
      pageUrl: APPLE_SIGN_IN_PAGE,
      state,
      hashedNonce: await sha256Hex(rawNonce),
    }),
  );
  const idToken = await token;

  const credential = new OAuthProvider('apple.com').credential({ idToken, rawNonce });
  return signInWithCredential(auth, credential);
}
