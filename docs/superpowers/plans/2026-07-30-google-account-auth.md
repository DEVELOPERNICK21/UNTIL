# Google Account Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-07-30-google-account-auth-design.md`

**Goal:** Add Google sign-in (Firebase `uid`), sync DOB/settings/premium to the account, hard-cap premium at 3 devices, with a soft post-onboarding account screen and Settings → Account.

**Architecture:** Provider-agnostic auth port + Firebase Auth (Google first). Firestore holds `users/{uid}`, `devices`, and `entitlement`. Local MMKV stays SSOT for the running app; sync use cases push/pull through repositories. Access gating: signed-in paid premium requires this device to be an active registered device (≤ 3).

**Tech Stack:** React Native 0.83, existing `@react-native-firebase/app`, add `@react-native-firebase/auth`, `@react-native-firebase/firestore`, `@react-native-google-signin/google-signin`, Jest for pure helpers/use cases

## Global Constraints

- Surfaces import hooks / di / ui / theme / types / navigation only (no `core` business logic, no direct Firestore)
- Permanent identity key is Firebase `uid` (never Google subject as data key)
- Max **3** active devices; hard-block premium on 4th until user removes one
- Skip after onboarding allowed; skip CTA must be subtle
- Sign-in surfaces this phase: post-onboarding account screen + Settings → Account (no paywall force)
- Human-copy: no em dashes, no coach filler
- Do not ship iOS App Store build with Google-only as primary login until Apple Sign-In is added (guideline 4.8)
- Apple Sign-In is out of scope this plan (auth port must leave room to link later)
- Device limit blocks **paid/cloud entitlement only**; local trial / life event unlock still work

## File map

| File | Responsibility |
|------|----------------|
| `src/types/auth.ts` | `AuthUser`, `AccountDevice`, `CloudEntitlement`, sync DTOs |
| `src/types/index.ts` | Re-export auth types; extend `AccessState` / `AccessControlInput` if needed |
| `src/persistence/schema.ts` | Local keys for `auth.uid`, `auth.email`, `auth.devicePremiumAllowed` |
| `src/domain/ports/IAuthService.ts` | Sign in / out / observe session (provider-agnostic) |
| `src/domain/ports/IAccountCloudStore.ts` | Firestore profile / devices / entitlement CRUD |
| `src/domain/repository/IAuthSessionRepository.ts` | Local auth session + devicePremiumAllowed cache |
| `src/core/account/deviceLimit.ts` | Pure: can register device, count active, MAX_ACTIVE_DEVICES = 3 |
| `src/domain/accessControl.ts` | Fold `devicePremiumAllowed` into effective premium for signed-in users |
| `src/domain/useCases/SignInWithGoogleUseCase.ts` | Auth + post-login sync orchestration entry |
| `src/domain/useCases/SignOutUseCase.ts` | Clear session; stop treating cloud entitlement as active |
| `src/domain/useCases/SyncAccountProfileUseCase.ts` | Merge local ↔ cloud DOB / deathAge / theme |
| `src/domain/useCases/RegisterDeviceUseCase.ts` | Register or hard-block over limit |
| `src/domain/useCases/RemoveAccountDeviceUseCase.ts` | Soft-deactivate remote device; re-register current if needed |
| `src/domain/useCases/BindEntitlementToAccountUseCase.ts` | Validate local purchase/license → write cloud entitlement → refresh local |
| `src/domain/useCases/ObserveAuthSessionUseCase.ts` | Subscribe to local session |
| `src/infrastructure/adapters/FirebaseAuthServiceAdapter.ts` | Firebase Auth + Google Sign-In |
| `src/infrastructure/adapters/FirestoreAccountCloudStoreAdapter.ts` | Firestore paths |
| `src/infrastructure/repositories/MmkvAuthSessionRepository.ts` | MMKV session |
| `src/di.ts` | Wire ports + use cases |
| `src/hooks/useAuthSession.ts` | Observe auth for UI |
| `src/hooks/useAccountActions.ts` | signIn / signOut / removeDevice / refresh |
| `src/surfaces/auth/AccountPromptScreen.tsx` | Soft post-onboarding Google + subtle skip + confirm sheet |
| `src/surfaces/app/AccountScreen.tsx` | Settings Account detail |
| `src/navigation/AuthNavigator.tsx` | Add `AccountPrompt` after paywall |
| `src/navigation/RootNavigator.tsx` | Add `Account` route |
| `src/surfaces/app/SettingsScreen.tsx` | Row → Account |
| `src/surfaces/auth/OnboardingPaywallScreen.tsx` | Navigate to AccountPrompt instead of `completeAuth` |
| `__tests__/deviceLimit.test.ts` | Pure device cap |
| `__tests__/accessControl.test.ts` | Extend for devicePremiumAllowed |
| `firestore.rules` (repo root or `firebase/`) | Owner-only user docs |
| Console / native config | Firebase Auth Google, OAuth client IDs, iOS URL scheme |

---

### Task 1: Pure device-limit helper + access control

**Files:**
- Create: `src/core/account/deviceLimit.ts`
- Create: `__tests__/deviceLimit.test.ts`
- Modify: `src/domain/accessControl.ts`
- Modify: `__tests__/accessControl.test.ts`
- Modify: `src/types/subscription.ts` (AccessState fields if needed)
- Modify: `src/domain/useCases/GetAccessStateUseCase.ts`

**Interfaces:**
- Produces:
  - `export const MAX_ACTIVE_DEVICES = 3`
  - `countActiveDevices(devices: { id: string; active: boolean }[]): number`
  - `canRegisterDevice(devices, deviceId): { ok: true } | { ok: false; reason: 'limit_reached' }`
  - If `deviceId` already active → always `{ ok: true }` (same device does not consume a new slot)
- AccessControlInput gains:
  - `signedIn: boolean`
  - `devicePremiumAllowed: boolean` (true when unsigned, or signed-in and this device registered)
- Effective paid premium for gating:
  - `effectiveIsPremium = input.isPremium && (!input.signedIn || input.devicePremiumAllowed)`
  - Store that as `AccessState.isPremium` **or** add `AccessState.effectiveIsPremium` and update `hasPremiumBundle` / `canAccessLife` to use effective paid flag. Prefer updating `isPremium` in the computed AccessState so existing call sites stay correct:
    - `isPremium: input.isPremium && (!input.signedIn || input.devicePremiumAllowed)`
  - Trial / life unlock unchanged

- [ ] **Step 1: Write failing deviceLimit tests**

```ts
import {
  MAX_ACTIVE_DEVICES,
  canRegisterDevice,
  countActiveDevices,
} from '../src/core/account/deviceLimit';

describe('deviceLimit', () => {
  const d = (id: string, active: boolean) => ({ id, active });

  it('allows when under cap', () => {
    expect(canRegisterDevice([d('a', true), d('b', true)], 'c')).toEqual({
      ok: true,
    });
  });

  it('allows same already-active device at cap', () => {
    const devices = [d('a', true), d('b', true), d('c', true)];
    expect(canRegisterDevice(devices, 'c')).toEqual({ ok: true });
    expect(countActiveDevices(devices)).toBe(MAX_ACTIVE_DEVICES);
  });

  it('blocks new device at cap', () => {
    const devices = [d('a', true), d('b', true), d('c', true)];
    expect(canRegisterDevice(devices, 'd')).toEqual({
      ok: false,
      reason: 'limit_reached',
    });
  });

  it('ignores inactive when counting', () => {
    expect(
      countActiveDevices([d('a', true), d('b', false), d('c', false)])
    ).toBe(1);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `yarn test __tests__/deviceLimit.test.ts -v`  
Expected: FAIL (module missing)

- [ ] **Step 3: Implement `deviceLimit.ts`**

```ts
export const MAX_ACTIVE_DEVICES = 3;

export type AccountDeviceRef = { id: string; active: boolean };

export function countActiveDevices(devices: AccountDeviceRef[]): number {
  return devices.filter(d => d.active).length;
}

export function canRegisterDevice(
  devices: AccountDeviceRef[],
  deviceId: string
): { ok: true } | { ok: false; reason: 'limit_reached' } {
  const existing = devices.find(d => d.id === deviceId);
  if (existing?.active) return { ok: true };
  const active = countActiveDevices(devices);
  if (active >= MAX_ACTIVE_DEVICES) {
    return { ok: false, reason: 'limit_reached' };
  }
  return { ok: true };
}
```

- [ ] **Step 4: Extend accessControl tests + implementation**

Add cases:
- signed in, `isPremium: true`, `devicePremiumAllowed: false` → `access.isPremium === false`, `hasPremiumBundle` false unless trial
- signed in, premium + allowed → premium true
- unsigned, premium true → premium true (device-bound path)

Update `GetAccessStateUseCase` to pass `signedIn` / `devicePremiumAllowed` from `IAuthSessionRepository` (stub defaults `signedIn: false`, `devicePremiumAllowed: true` until Task 2 wires the repo — or create a minimal in-memory stub in di for compile). Prefer implementing the thin `MmkvAuthSessionRepository` early in Task 2; for this task only change `computeAccessState` signature with defaults:

```ts
signedIn?: boolean; // default false
devicePremiumAllowed?: boolean; // default true
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `yarn test __tests__/deviceLimit.test.ts __tests__/accessControl.test.ts -v`

- [ ] **Step 6: Commit**

```bash
git add src/core/account/deviceLimit.ts __tests__/deviceLimit.test.ts \
  src/domain/accessControl.ts __tests__/accessControl.test.ts src/types/subscription.ts
git commit -m "feat(account): add 3-device limit helper and access gate"
```

---

### Task 2: Auth session types, MMKV repo, ports

**Files:**
- Create: `src/types/auth.ts`
- Modify: `src/types/index.ts`
- Modify: `src/persistence/schema.ts`
- Create: `src/domain/repository/IAuthSessionRepository.ts`
- Create: `src/infrastructure/repositories/MmkvAuthSessionRepository.ts`
- Create: `src/domain/ports/IAuthService.ts`
- Create: `src/domain/ports/IAccountCloudStore.ts`
- Modify: `src/di.ts` (instantiate session repo; thread into `GetAccessStateUseCase`)

**Interfaces:**

```ts
// types/auth.ts
export type AuthProviderId = 'google' | 'apple';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  providers: AuthProviderId[];
}

export interface AccountDevice {
  id: string;
  platform: 'ios' | 'android';
  label: string | null;
  lastSeenAt: number;
  createdAt: number;
  active: boolean;
}

export interface CloudEntitlement {
  active: boolean;
  source: 'play' | 'app_store' | 'license' | 'none';
  purchaseType: 'monthly' | 'yearly' | 'lifetime' | null;
  lastValidatedAt: number;
}

export interface CloudUserProfile {
  birthDate: string | null;
  deathAge: number | null;
  theme: string | null;
  updatedAt: number;
}
```

```ts
// IAuthSessionRepository
getUid(): string | null;
setUid(uid: string | null): void;
getEmail(): string | null;
setEmail(email: string | null): void;
getDevicePremiumAllowed(): boolean; // default true when signed out
setDevicePremiumAllowed(value: boolean): void;
clear(): void;
getState(): { uid: string | null; email: string | null; devicePremiumAllowed: boolean };
subscribe(cb: () => void): () => void;
```

```ts
// IAuthService
signInWithGoogle(): Promise<AuthUser>;
signOut(): Promise<void>;
getCurrentUser(): AuthUser | null;
subscribe(cb: (user: AuthUser | null) => void): () => void;
```

```ts
// IAccountCloudStore
getProfile(uid: string): Promise<CloudUserProfile | null>;
upsertProfile(uid: string, patch: Partial<CloudUserProfile>): Promise<void>;
listDevices(uid: string): Promise<AccountDevice[]>;
upsertDevice(uid: string, device: AccountDevice): Promise<void>;
setDeviceActive(uid: string, deviceId: string, active: boolean): Promise<void>;
getEntitlement(uid: string): Promise<CloudEntitlement | null>;
setEntitlement(uid: string, entitlement: CloudEntitlement): Promise<void>;
```

STORAGE_KEYS:
- `AUTH_UID: 'auth.uid'`
- `AUTH_EMAIL: 'auth.email'`
- `AUTH_DEVICE_PREMIUM_ALLOWED: 'auth.devicePremiumAllowed'`

- [ ] **Step 1: Add types + schema keys + MMKV repo**
- [ ] **Step 2: Add port interfaces (no Firebase yet)**
- [ ] **Step 3: Wire `MmkvAuthSessionRepository` in `di.ts`; update `GetAccessStateUseCase`:**

```ts
execute(now = Date.now()): AccessState {
  const signedIn = this.authSession.getUid() != null;
  return computeAccessState({
    now,
    isPremium: this.subscriptionRepository.getIsPremium(),
    // ...existing fields...
    signedIn,
    devicePremiumAllowed: signedIn
      ? this.authSession.getDevicePremiumAllowed()
      : true,
  });
}
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(account): add auth session types, ports, and MMKV repo"
```

---

### Task 3: Firebase Auth + Google Sign-In adapter

**Files:**
- Modify: `package.json` / lockfile (yarn add)
- Create: `src/infrastructure/adapters/FirebaseAuthServiceAdapter.ts`
- Create: `src/infrastructure/adapters/FirestoreAccountCloudStoreAdapter.ts`
- Create: `firestore.rules` (or `firebase/firestore.rules`)
- Native: Android `google-services` already present; ensure OAuth clients; iOS `GoogleService-Info.plist` + URL scheme for Google
- Modify: `src/di.ts` — bind real adapters (or no-op stubs behind `__DEV__` flag only if credentials missing; prefer real adapters + documented console setup)

**Console setup (do before device QA):**
1. Firebase Console → Authentication → enable Google
2. Firestore → create database
3. Google Cloud → OAuth client IDs (Android SHA-1, iOS reverse client id)
4. Download updated `google-services.json` / `GoogleService-Info.plist` if needed

**Packages:**
```bash
yarn add @react-native-firebase/auth@^21.12.0 @react-native-firebase/firestore@^21.12.0 @react-native-google-signin/google-signin
cd ios && pod install
```

**Firestore paths:**
- `users/{uid}` → profile fields
- `users/{uid}/devices/{deviceId}` → AccountDevice
- `users/{uid}/entitlement/current` → CloudEntitlement (single doc)

**Rules sketch (owner-only):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

**FirebaseAuthServiceAdapter:**
- Configure GoogleSignin with `webClientId` from Firebase (web client)
- `signInWithGoogle`: Google Sign-In → `GoogleAuthProvider.credential` → `auth().signInWithCredential`
- Map Firebase user → `AuthUser` (`providers: ['google']`)
- `signOut`: GoogleSignin.signOut + auth().signOut

- [ ] **Step 1: Install packages + pods**
- [ ] **Step 2: Implement adapters**
- [ ] **Step 3: Add firestore.rules; document deploy: `firebase deploy --only firestore:rules`**
- [ ] **Step 4: Wire adapters in `di.ts`**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat(account): add Firebase Auth Google and Firestore adapters"
```

---

### Task 4: Use cases — sign-in, device register, profile sync, entitlement bind, sign-out

**Files:**
- Create use cases listed in file map
- Create: `__tests__/registerDevice.test.ts` (pure decision via mocked `IAccountCloudStore`)
- Modify: `src/di.ts` exports

**SignInWithGoogleUseCase.execute():**
1. `user = await authService.signInWithGoogle()`
2. `authSession.setUid(user.uid); setEmail(user.email)`
3. `await syncAccountProfile.execute(user.uid)`
4. `reg = await registerDevice.execute(user.uid)`
5. `authSession.setDevicePremiumAllowed(reg.registered)`
6. If `reg.registered`: `await bindEntitlement.execute(user.uid)`
7. Return `{ user, deviceRegistered: reg.registered, deviceLimitReached: !reg.registered }`

**RegisterDeviceUseCase:**
1. `deviceId = await deviceIdProvider.getDeviceId()`
2. `devices = await cloud.listDevices(uid)`
3. `decision = canRegisterDevice(devices, deviceId)`
4. If not ok → return `{ registered: false }`
5. Else upsert device `{ id, platform, active: true, lastSeenAt: now, createdAt, label }`
6. Return `{ registered: true }`

**SyncAccountProfileUseCase:**
- Read local profile from `TimeRepository` / theme store
- Read cloud profile
- Merge: if cloud has birthDate and local empty → write local; if local has birthDate and cloud empty → upsert cloud; if both differ → prefer newer `updatedAt` if present, else **prefer local on first bind after onboarding** (document in code comment)
- Theme: same idea, keep simple

**BindEntitlementToAccountUseCase:**
1. If local `getIsPremium()` from Play (`purchaseType` monthly|yearly|lifetime) or valid license path:
   - Prefer calling existing restore/verify use cases when token/license present rather than trusting flag alone when possible
2. `cloud.setEntitlement({ active: true, source, purchaseType, lastValidatedAt })`
3. If cloud entitlement active and device allowed → `subscriptionRepository.setIsPremium(true)` (+ metadata if present)
4. If cloud active but device not allowed → do **not** set local premium from cloud; keep `devicePremiumAllowed` false
5. If cloud inactive and local has no store/license proof → leave local as-is for unsigned migration edge cases; when signed in with no proof, sync down cloud `active: false` to clear cloud-only premium

**SignOutUseCase:**
1. `authService.signOut()`
2. `authSession.clear()` (devicePremiumAllowed resets to default true for unsigned)
3. Do **not** wipe DOB
4. Stop treating cloud entitlement as active: if premium was only from cloud with no local purchase token/license, `setIsPremium(false)`; if local Play token/license exists, leave local premium (device path)

- [ ] **Step 1: Implement use cases + unit test RegisterDevice with mocks**
- [ ] **Step 2: Export from di**
- [ ] **Step 3: Commit**

```bash
git commit -m "feat(account): add sign-in, device, profile sync, entitlement use cases"
```

---

### Task 5: Hooks

**Files:**
- Create: `src/hooks/useAuthSession.ts`
- Create: `src/hooks/useAccountActions.ts`
- Modify: `src/hooks/index.ts`

**useAuthSession:**
- Subscribe `ObserveAuthSessionUseCase` / session repo
- Return `{ uid, email, signedIn, devicePremiumAllowed }`

**useAccountActions:**
```ts
{
  signInWithGoogle: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  refreshDevices: () => Promise<AccountDevice[]>;
  busy: boolean;
  error: string | null;
}
```

Surfaces must not import use cases from `domain/` directly — only via these hooks + `di` inside hooks.

- [ ] **Step 1: Implement hooks**
- [ ] **Step 2: Commit**

```bash
git commit -m "feat(account): add auth session and account action hooks"
```

---

### Task 6: Post-onboarding `AccountPromptScreen` + AuthNavigator

**Files:**
- Create: `src/surfaces/auth/AccountPromptScreen.tsx`
- Modify: `src/navigation/AuthNavigator.tsx`
- Modify: `src/surfaces/auth/OnboardingPaywallScreen.tsx`
- Optional: leave unused `LoginScreen.tsx` alone (do not wire) or delete later — **do not** confuse with AccountPrompt

**Flow change:**
- Paywall purchase success / Maybe later → `navigation.navigate('AccountPrompt')` instead of `completeAuth(...)`
- AccountPrompt success / skip confirm → `completeAuth(...)` with appropriate analytics params

**UI (human copy):**
- Headline: `Keep your data with you`
- Benefit: `Saves DOB, premium, and settings across devices.`
- Primary button: `Continue with Google`
- Subtle bottom text (muted, small): `Continue without account`
- Confirm sheet:
  - Title: `Without an account, data stays on this phone`
  - Body: `If you change phones or reinstall, DOB and premium may not come with you.`
  - Primary: `Sign in to keep it`
  - Subtle: `Continue anyway`

If sign-in succeeds but `deviceLimitReached`:
- Still complete onboarding (or stay and show message). Prefer: complete onboarding, show non-blocking note that premium needs a free device slot (Settings → Account). Do not block reaching Home.

- [ ] **Step 1: Add AccountPrompt route + screen**
- [ ] **Step 2: Retarget paywall exits to AccountPrompt**
- [ ] **Step 3: Manual smoke: skip path reaches Home; Google path creates session (device with Firebase config)**
- [ ] **Step 4: Commit**

```bash
git commit -m "feat(onboarding): soft Google account prompt after paywall"
```

---

### Task 7: Settings → Account screen

**Files:**
- Create: `src/surfaces/app/AccountScreen.tsx`
- Modify: `src/navigation/RootNavigator.tsx` — `Account: undefined`
- Modify: `src/surfaces/app/SettingsScreen.tsx` — Account section row “Sign in” / email
- Modify: `src/surfaces/app/index.ts` if needed

**Signed out:** Google CTA + short benefits (same copy tone as prompt)

**Signed in:**
- Email / provider label
- Device list: id short label / platform / last seen / Remove
- If `!devicePremiumAllowed`: banner  
  `This account is already used on 3 devices. Remove one to unlock premium here.`
- Sign out

Removing another device then call `RegisterDeviceUseCase` for current device + `BindEntitlement` if needed.

- [ ] **Step 1: AccountScreen + navigation**
- [ ] **Step 2: Settings row**
- [ ] **Step 3: Commit**

```bash
git commit -m "feat(settings): add Account screen with devices and Google sign-in"
```

---

### Task 8: Bootstrap session restore + analytics identity

**Files:**
- Modify: `src/app.tsx` or small bootstrap hook (e.g. `useAuthBootstrap` next to `useAnalyticsBootstrap`)
- Modify: `src/hooks/useAnalyticsBootstrap.ts` — when signed in, identify PostHog / Crashlytics with `uid` instead of only device id (keep device id as property)

On app start if Firebase `currentUser`:
1. Mirror into `authSession`
2. Re-run register device (same id → ok) + entitlement pull
3. Update `devicePremiumAllowed`

- [ ] **Step 1: Bootstrap hook**
- [ ] **Step 2: Commit**

```bash
git commit -m "feat(account): restore Firebase session and rebind device on launch"
```

---

### Task 9: Verification checklist (manual + automated)

- [ ] **Automated:** `yarn test __tests__/deviceLimit.test.ts __tests__/accessControl.test.ts __tests__/registerDevice.test.ts`
- [ ] Fresh install → onboarding → AccountPrompt → skip confirm → Home, no uid
- [ ] AccountPrompt → Google → uid set, DOB in Firestore
- [ ] Settings → Account → sign out → sign in again
- [ ] Three devices registered; fourth signs in, premium blocked, banner shown; remove one → premium unlocks
- [ ] Unsigned local Play premium still works (skip path)
- [ ] Signed-in user with local purchase → entitlement doc written
- [ ] Commit any leftover fixes

```bash
git commit -m "test(account): verify Google auth device cap and sync paths"
```

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| Google first / uid identity | 2–4 |
| Firebase + profile sync | 3–4 |
| Soft skip post-onboarding | 6 |
| Settings Account | 7 |
| No paywall forced login | 6 (paywall still optional; account after) |
| 3-device hard block | 1, 4, 7 |
| Device→user entitlement | 4 |
| Sign out clears cloud-gated premium | 4 |
| Apple later / provider-agnostic | 2 ports |
| Guideline 4.8 note | Global Constraints |
| Trial still works when device blocked | 1 |

## Out of this plan

- Sign in with Apple
- Paywall-required login
- Auto-kick oldest device
- Server-side purchase receipt verification hardening beyond current Play/license adapters
