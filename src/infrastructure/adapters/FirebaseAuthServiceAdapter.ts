/**
 * FirebaseAuthServiceAdapter — Google Sign-In via Firebase Auth.
 *
 * Console setup required before device QA (not done by this adapter):
 * 1. Firebase Console -> Authentication -> Sign-in method -> enable Google.
 * 2. Firestore -> create database (see firestore.rules at repo root).
 * 3. Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client IDs:
 *    - Android client (package + release/debug SHA-1)
 *    - iOS client (bundle id `com.develoeprnick.UNTIL`)
 *    - Web client (auto-created alongside the above; this is `webClientId` below)
 * 4. Re-download `android/app/google-services.json` and
 *    `ios/GoogleService-Info.plist` once those OAuth clients exist — the
 *    versions committed at the time this adapter was written have an empty
 *    `oauth_client` list, so there is no real web client id to read yet.
 * 5. iOS: add the reversed iOS client id as a URL scheme (Xcode > Info > URL
 *    Types) once the iOS OAuth client is created — required for the Google
 *    Sign-In redirect to return to the app.
 *
 * Until step 3/4 are done, `GOOGLE_WEB_CLIENT_ID` is a placeholder and
 * `signInWithGoogle` will fail at `GoogleSignin.signIn()`. Set
 * `UNTIL_GOOGLE_WEB_CLIENT_ID` (env) or replace the constant once a real
 * client id is available. Do not invent one.
 */

import type { IAuthService } from '../../domain/ports/IAuthService';
import type { AuthUser } from '../../types';
import { recordCrashError } from '../../services/analytics';

const GOOGLE_WEB_CLIENT_ID: string =
  process.env.UNTIL_GOOGLE_WEB_CLIENT_ID ?? '<MISSING_GOOGLE_WEB_CLIENT_ID>';

interface MinimalFirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthCredentialLike {
  providerId: string;
  token: string;
  secret: string;
}

interface AuthModule {
  instance: unknown;
  onAuthStateChanged: (
    auth: unknown,
    listener: (user: MinimalFirebaseUser | null) => void
  ) => () => void;
  signInWithCredential: (
    auth: unknown,
    credential: AuthCredentialLike
  ) => Promise<{ user: MinimalFirebaseUser }>;
  signOut: (auth: unknown) => Promise<void>;
  GoogleAuthProvider: {
    credential: (idToken: string | null, accessToken?: string) => AuthCredentialLike;
  };
  currentUser: () => MinimalFirebaseUser | null;
}

interface GoogleSigninModule {
  configure: (options: { webClientId: string }) => void;
  hasPlayServices: (options: { showPlayServicesUpdateDialog: boolean }) => Promise<boolean>;
  signIn: () => Promise<
    | { type: 'success'; data: { idToken: string | null; accessToken?: string } }
    | { type: 'cancelled'; data: null }
  >;
  signOut: () => Promise<null>;
}

function getGoogleSignin(): GoogleSigninModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-google-signin/google-signin') as {
    GoogleSignin: GoogleSigninModule;
  };
  return mod.GoogleSignin;
}

/**
 * Lazily resolves the Firebase Auth module. Returns null if the native
 * FIRApp was never configured (e.g. missing plist/config on this build),
 * mirroring the guard used in services/analytics.ts.
 */
function getAuthModule(): AuthModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getApp, getApps } = require('@react-native-firebase/app') as {
      getApp: () => unknown;
      getApps: () => unknown[];
    };
    if (getApps().length === 0) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const {
      getAuth,
      onAuthStateChanged,
      signInWithCredential,
      signOut,
      GoogleAuthProvider,
    } = require('@react-native-firebase/auth') as {
      getAuth: (app: unknown) => unknown & { currentUser: MinimalFirebaseUser | null };
      onAuthStateChanged: AuthModule['onAuthStateChanged'];
      signInWithCredential: AuthModule['signInWithCredential'];
      signOut: AuthModule['signOut'];
      GoogleAuthProvider: AuthModule['GoogleAuthProvider'];
    };
    const instance = getAuth(getApp()) as { currentUser: MinimalFirebaseUser | null };
    return {
      instance,
      onAuthStateChanged,
      signInWithCredential,
      signOut,
      GoogleAuthProvider,
      currentUser: () => instance.currentUser,
    };
  } catch (e) {
    recordCrashError(e, 'FirebaseAuthServiceAdapter.getAuthModule');
    return null;
  }
}

function mapFirebaseUser(user: MinimalFirebaseUser | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    providers: ['google'],
  };
}

let googleSignInConfigured = false;

function ensureGoogleSignInConfigured(): void {
  if (googleSignInConfigured) return;
  getGoogleSignin().configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  googleSignInConfigured = true;
}

export class FirebaseAuthServiceAdapter implements IAuthService {
  async signInWithGoogle(): Promise<AuthUser> {
    const auth = getAuthModule();
    if (!auth) {
      throw new Error('Firebase Auth is unavailable on this device/build.');
    }
    ensureGoogleSignInConfigured();

    const GoogleSignin = getGoogleSignin();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success') {
      throw new Error('Google sign-in was cancelled.');
    }
    const { idToken } = response.data;
    if (!idToken) {
      throw new Error('Google sign-in did not return an ID token.');
    }

    const credential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth.signInWithCredential(auth.instance, credential);
    const mapped = mapFirebaseUser(userCredential.user);
    if (!mapped) {
      throw new Error('Firebase sign-in did not return a user.');
    }
    return mapped;
  }

  async signOut(): Promise<void> {
    try {
      await getGoogleSignin().signOut();
    } catch (e) {
      recordCrashError(e, 'FirebaseAuthServiceAdapter.signOut.google');
    }
    const auth = getAuthModule();
    if (!auth) return;
    await auth.signOut(auth.instance);
  }

  getCurrentUser(): AuthUser | null {
    const auth = getAuthModule();
    if (!auth) return null;
    return mapFirebaseUser(auth.currentUser());
  }

  subscribe(callback: (user: AuthUser | null) => void): () => void {
    const auth = getAuthModule();
    if (!auth) return () => {};
    return auth.onAuthStateChanged(auth.instance, user => {
      callback(mapFirebaseUser(user));
    });
  }
}
