/**
 * Desktop session: what happens after a provider credential comes back, and
 * what the panel shows. Nothing reaches localStorage until the desktop slot is
 * actually claimed, so the extra only shows a % for a registered machine.
 */

import {
  getAdditionalUserInfo,
  signOut,
  type User,
  type UserCredential,
} from 'firebase/auth';
import type {
  AccountDevice,
  AuthProviderId,
  AuthUser,
  CloudUserProfile,
} from '@until/types';
import { isUnderMinimumAge } from '@until/core/legal/ageGate';
import { auth } from './firebase';
import { cloudStore, completeDesktopSignIn, deviceIdProvider } from './di';
import { nextStepAfterSignIn } from './auth/afterSignIn';
import {
  EMPTY_LOCAL_STATE,
  entitlementAfterRead,
  loadLocalState,
  saveLocalState,
} from './localState';

export type SessionView =
  | { kind: 'signed_out'; message?: string }
  | { kind: 'working' }
  | { kind: 'under_age' }
  | { kind: 'setup'; askBirthDate: boolean; askAgeConfirmation: boolean }
  | { kind: 'needs_replace'; existing: AccountDevice }
  | { kind: 'limit_reached' }
  | { kind: 'incomplete' }
  | { kind: 'signed_in' };

/** Set when the provider just created the Firebase user on this machine. */
let newUser = false;

function toAuthUser(user: User): AuthUser {
  const providers = user.providerData.flatMap((p): AuthProviderId[] =>
    p.providerId === 'google.com' ? ['google'] : p.providerId === 'apple.com' ? ['apple'] : [],
  );
  return { uid: user.uid, email: user.email, displayName: user.displayName, providers };
}

function currentUser(): User {
  const user = auth.currentUser;
  if (!user) throw new Error('No signed-in user');
  return user;
}

export function initialView(): SessionView {
  return loadLocalState().deviceRegistered ? { kind: 'signed_in' } : { kind: 'signed_out' };
}

export async function afterCredential(credential: UserCredential): Promise<SessionView> {
  newUser = getAdditionalUserInfo(credential)?.isNewUser === true;
  return continueSignIn();
}

/** Profile check, then slot claim. Also the "Try again" path. */
export async function continueSignIn(): Promise<SessionView> {
  let profile;
  try {
    profile = await cloudStore.getProfile(currentUser().uid);
  } catch {
    return { kind: 'incomplete' };
  }

  const step = nextStepAfterSignIn(profile, new Date());
  switch (step.kind) {
    case 'under_minimum_age':
      await signOut(auth);
      return { kind: 'under_age' };
    case 'setup':
      return {
        kind: 'setup',
        askBirthDate: step.askBirthDate,
        askAgeConfirmation: step.askAgeConfirmation,
      };
    case 'ready':
      return register(false);
  }
}

export async function saveSetup(input: {
  birthDate: string | null;
  confirmedMinimumAge: boolean;
}): Promise<SessionView> {
  if (isUnderMinimumAge(input.birthDate, new Date())) {
    await abandonSignIn();
    return { kind: 'under_age' };
  }
  const patch: Partial<CloudUserProfile> = {};
  if (input.birthDate) patch.birthDate = input.birthDate;
  if (input.confirmedMinimumAge) {
    patch.minimumAgeConfirmed = true;
    patch.minimumAgeConfirmedAt = Date.now();
  }
  try {
    await cloudStore.upsertProfile(currentUser().uid, patch);
  } catch {
    return { kind: 'incomplete' };
  }
  newUser = false;
  return register(false);
}

/**
 * Leaves sign-in without claiming a slot. A user the provider created just now
 * never confirmed 13+, so the Firebase account is removed rather than kept.
 */
export async function abandonSignIn(): Promise<SessionView> {
  const user = auth.currentUser;
  if (user && newUser) {
    await user.delete().catch(() => signOut(auth));
  } else {
    await signOut(auth).catch(() => {});
  }
  newUser = false;
  return { kind: 'signed_out' };
}

export async function register(replaceConfirmed: boolean): Promise<SessionView> {
  const user = currentUser();
  const result = await completeDesktopSignIn.execute(toAuthUser(user), { replaceConfirmed });
  switch (result.status) {
    case 'needs_replace':
      return { kind: 'needs_replace', existing: result.existing };
    case 'limit_reached':
      await signOut(auth);
      return { kind: 'limit_reached' };
    case 'incomplete':
      return { kind: 'incomplete' };
    case 'registered': {
      const profile = await cloudStore.getProfile(user.uid).catch(() => null);
      saveLocalState({
        uid: user.uid,
        email: user.email,
        birthDate: profile?.birthDate ?? null,
        deathAge: profile?.deathAge ?? null,
        deviceRegistered: true,
        // The use case reports a failed read as null too; refreshSession settles it.
        entitlementActive: entitlementAfterRead(
          loadLocalState(),
          user.uid,
          result.entitlement ?? 'unknown',
        ),
      });
      return { kind: 'signed_in' };
    }
  }
}

export const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Re-reads this machine's slot, profile and entitlement. Offline or on any
 * read error the cached state stays, so the extra keeps ticking.
 */
export async function refreshSession(): Promise<SessionView | null> {
  const local = loadLocalState();
  if (!local.uid || !local.deviceRegistered) return null;
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || user.uid !== local.uid) {
    saveLocalState(EMPTY_LOCAL_STATE);
    return { kind: 'signed_out' };
  }
  try {
    const deviceId = await deviceIdProvider.getDeviceId();
    const devices = await cloudStore.listDevices(user.uid);
    const mine = devices.find(d => d.id === deviceId);
    if (!mine?.active) {
      await signOut(auth);
      saveLocalState(EMPTY_LOCAL_STATE);
      return { kind: 'signed_out', message: 'This computer was signed out of your account.' };
    }
  } catch {
    return null;
  }

  const [profile, entitlement] = await Promise.all([
    cloudStore.getProfile(user.uid).catch(() => undefined),
    cloudStore.getEntitlement(user.uid).catch(() => 'unknown' as const),
  ]);
  saveLocalState({
    ...local,
    email: user.email,
    birthDate: profile ? profile.birthDate : local.birthDate,
    deathAge: profile ? profile.deathAge : local.deathAge,
    entitlementActive: entitlementAfterRead(local, user.uid, entitlement),
  });
  return { kind: 'signed_in' };
}

export async function signOutDesktop(): Promise<SessionView> {
  const local = loadLocalState();
  if (local.uid && local.deviceRegistered && auth.currentUser) {
    const deviceId = await deviceIdProvider.getDeviceId();
    await cloudStore.setDeviceActive(local.uid, deviceId, false).catch(() => {});
  }
  await signOut(auth).catch(() => {});
  saveLocalState(EMPTY_LOCAL_STATE);
  return { kind: 'signed_out' };
}
