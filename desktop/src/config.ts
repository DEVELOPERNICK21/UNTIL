/**
 * Desktop configuration. The Firebase web config is public by design (security
 * comes from Firestore rules). The Google desktop client secret is not secret
 * either for installed apps (RFC 8252), but it stays out of git: set it in
 * desktop/.env.local.
 */

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBTXhVAqdqasVbpFKf25C-0pdakGL-6Pcs',
  authDomain: 'until-b7624.firebaseapp.com',
  projectId: 'until-b7624',
  storageBucket: 'until-b7624.firebasestorage.app',
  messagingSenderId: '150745476537',
  appId: '1:150745476537:web:9f9bd6b9ccb776d8399a68',
} as const;

export const GOOGLE_DESKTOP_CLIENT_ID: string =
  import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_ID ?? '';
export const GOOGLE_DESKTOP_CLIENT_SECRET: string =
  import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_SECRET ?? '';

export const APPLE_SIGN_IN_PAGE: string =
  import.meta.env.VITE_APPLE_SIGN_IN_PAGE ??
  'https://developernick1-until.vercel.app/desktop-sign-in.html';

/** How long to wait for the browser to come back before giving up. */
export const BROWSER_SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000;
