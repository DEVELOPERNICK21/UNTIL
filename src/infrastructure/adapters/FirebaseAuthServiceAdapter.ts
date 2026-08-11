/**
 * FirebaseAuthServiceAdapter — Google + email/password via Firebase Auth.
 *
 * Console: enable Google and Email/Password under Authentication → Sign-in method.
 * Google also needs UNTIL_GOOGLE_WEB_CLIENT_ID and platform OAuth clients
 * (see earlier adapter notes / verification doc).
 */

import type { IAuthService } from '../../domain/ports/IAuthService';
import type { AuthProviderId, AuthUser } from '../../types';
import { AuthCancelledError, isAuthCancelledError } from '../../domain/errors/authErrors';
import { recordCrashError } from '../../services/analytics';

const MISSING_GOOGLE_WEB_CLIENT_ID = '<MISSING_GOOGLE_WEB_CLIENT_ID>';

const GOOGLE_WEB_CLIENT_ID: string =
  process.env.UNTIL_GOOGLE_WEB_CLIENT_ID ?? MISSING_GOOGLE_WEB_CLIENT_ID;

interface ProviderDataEntry {
  providerId: string;
}

interface MinimalFirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  providerData?: ProviderDataEntry[];
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
  signInWithEmailAndPassword: (
    auth: unknown,
    email: string,
    password: string
  ) => Promise<{ user: MinimalFirebaseUser }>;
  createUserWithEmailAndPassword: (
    auth: unknown,
    email: string,
    password: string
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
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut,
      GoogleAuthProvider,
    } = require('@react-native-firebase/auth') as {
      getAuth: (app: unknown) => unknown & { currentUser: MinimalFirebaseUser | null };
      onAuthStateChanged: AuthModule['onAuthStateChanged'];
      signInWithCredential: AuthModule['signInWithCredential'];
      signInWithEmailAndPassword: AuthModule['signInWithEmailAndPassword'];
      createUserWithEmailAndPassword: AuthModule['createUserWithEmailAndPassword'];
      signOut: AuthModule['signOut'];
      GoogleAuthProvider: AuthModule['GoogleAuthProvider'];
    };
    const instance = getAuth(getApp()) as { currentUser: MinimalFirebaseUser | null };
    return {
      instance,
      onAuthStateChanged,
      signInWithCredential,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut,
      GoogleAuthProvider,
      currentUser: () => instance.currentUser,
    };
  } catch (e) {
    recordCrashError(e, 'FirebaseAuthServiceAdapter.getAuthModule');
    return null;
  }
}

function mapProviders(user: MinimalFirebaseUser): AuthProviderId[] {
  const ids = (user.providerData ?? []).map(p => p.providerId);
  const providers: AuthProviderId[] = [];
  if (ids.includes('google.com')) providers.push('google');
  if (ids.includes('apple.com')) providers.push('apple');
  if (ids.includes('password')) providers.push('password');
  if (providers.length === 0) providers.push('password');
  return providers;
}

function mapFirebaseUser(user: MinimalFirebaseUser | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    providers: mapProviders(user),
  };
}

function requireAuth(): AuthModule {
  const auth = getAuthModule();
  if (!auth) {
    throw new Error('Firebase Auth is unavailable on this device/build.');
  }
  return auth;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapAuthError(error: unknown, fallback: string): Error {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  switch (code) {
    case 'auth/invalid-email':
      return new Error('Enter a valid email address.');
    case 'auth/user-disabled':
      return new Error('This account is disabled.');
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return new Error('Email or password is wrong.');
    case 'auth/email-already-in-use':
      return new Error('That email already has an account. Sign in instead.');
    case 'auth/weak-password':
      return new Error('Use a password with at least 6 characters.');
    case 'auth/too-many-requests':
      return new Error('Too many tries. Wait a bit and try again.');
    case 'auth/network-request-failed':
      return new Error('Network error. Check your connection.');
    default:
      if (error instanceof Error && error.message) {
        return new Error(error.message);
      }
      return new Error(fallback);
  }
}

let googleSignInConfigured = false;

function ensureGoogleSignInConfigured(): void {
  if (googleSignInConfigured) return;
  const webClientId = GOOGLE_WEB_CLIENT_ID.trim();
  if (!webClientId || webClientId === MISSING_GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      'Google sign-in is not set up in this build. UNTIL_GOOGLE_WEB_CLIENT_ID is missing.'
    );
  }
  getGoogleSignin().configure({ webClientId });
  googleSignInConfigured = true;
}

export class FirebaseAuthServiceAdapter implements IAuthService {
  async signInWithGoogle(): Promise<AuthUser> {
    const auth = requireAuth();
    ensureGoogleSignInConfigured();

    const GoogleSignin = getGoogleSignin();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    let response: Awaited<ReturnType<GoogleSigninModule['signIn']>>;
    try {
      response = await GoogleSignin.signIn();
    } catch (e) {
      if (isAuthCancelledError(e)) {
        throw new AuthCancelledError();
      }
      throw e;
    }
    if (response.type !== 'success') {
      throw new AuthCancelledError();
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

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const auth = requireAuth();
    const normalized = normalizeEmail(email);
    if (!normalized || !password) {
      throw new Error('Enter email and password.');
    }
    try {
      const { user } = await auth.signInWithEmailAndPassword(
        auth.instance,
        normalized,
        password
      );
      const mapped = mapFirebaseUser(user);
      if (!mapped) {
        throw new Error('Sign-in did not return a user.');
      }
      return mapped;
    } catch (e) {
      throw mapAuthError(e, 'Could not sign in with email.');
    }
  }

  async createAccountWithEmail(email: string, password: string): Promise<AuthUser> {
    const auth = requireAuth();
    const normalized = normalizeEmail(email);
    if (!normalized || !password) {
      throw new Error('Enter email and password.');
    }
    if (password.length < 6) {
      throw new Error('Use a password with at least 6 characters.');
    }
    try {
      const { user } = await auth.createUserWithEmailAndPassword(
        auth.instance,
        normalized,
        password
      );
      const mapped = mapFirebaseUser(user);
      if (!mapped) {
        throw new Error('Account create did not return a user.');
      }
      return mapped;
    } catch (e) {
      throw mapAuthError(e, 'Could not create account.');
    }
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
