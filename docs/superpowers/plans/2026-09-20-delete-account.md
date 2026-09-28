# Delete Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add in-app Delete Account (Firebase Auth + Firestore wipe, RC logOut, keep local progress) for App Store Guideline 5.1.1.

**Architecture:** Screen → `useAccountActions` → `DeleteAccountUseCase` → `IAuthService` + `IAccountCloudStore` + existing `ResetPurchasesUserUseCase` / `SignOutUseCase.clearLocalSession()`. Firestore delete while Auth token is valid, then Auth `deleteUser`, with one reauth retry on `auth/requires-recent-login`.

**Tech Stack:** React Native 0.86, Firebase Auth / Firestore (`@react-native-firebase/*`), RevenueCat via existing purchases port, Jest unit tests.

**Spec:** `docs/superpowers/specs/2026-09-20-delete-account-design.md`

## Global Constraints

- Local DOB / settings / time progress stay; only auth session (+ cloud-only premium) clear, same rules as sign-out (`hasLocalPurchaseProof`).
- Human copy only (no em dashes, no coach clichés): button `Delete account`, confirm body as in spec.
- Surfaces must not import `core` / `infrastructure` / repositories; use hooks + `di`.
- Do not commit unless the user explicitly asks (repo user rule).

---

## File map

| File | Role |
|------|------|
| `src/domain/errors/authErrors.ts` | `AuthRequiresRecentLoginError`, `AuthRequiresPasswordError`, helpers |
| `src/domain/ports/IAuthService.ts` | `deleteAccount`, `reauthenticateWithGoogle`, `reauthenticateWithEmail` |
| `src/domain/ports/IAccountCloudStore.ts` | `deleteUserData(uid)` |
| `src/infrastructure/adapters/FirebaseAuthServiceAdapter.ts` | Implement Auth delete / reauth |
| `src/infrastructure/adapters/FirestoreAccountCloudStoreAdapter.ts` | Implement recursive user wipe |
| `src/domain/useCases/DeleteAccountUseCase.ts` | Orchestration |
| `src/domain/useCases/index.ts` | Export (if other use cases are listed; currently thin — add only if pattern expects it) |
| `src/di.ts` | Wire `deleteAccountUseCase` |
| `src/hooks/useAccountActions.ts` | `deleteAccount()` + password prompt path |
| `src/surfaces/app/AccountScreen.tsx` | Destructive button + confirm alert |
| `__tests__/deleteAccountUseCase.test.ts` | Unit tests |
| `__tests__/syncAccountProfile.test.ts` | Add `deleteUserData` to mock cloud |
| `website/src/domain/legal/privacy.ts` | Mention in-app delete |

---

### Task 1: Auth error types + port signatures

**Files:**
- Modify: `src/domain/errors/authErrors.ts`
- Modify: `src/domain/ports/IAuthService.ts`
- Modify: `src/domain/ports/IAccountCloudStore.ts`
- Test: `__tests__/deleteAccountUseCase.test.ts` (create failing skeleton that imports errors)

**Interfaces:**
- Produces:
  - `AuthRequiresRecentLoginError` (code `auth/requires-recent-login`)
  - `AuthRequiresPasswordError` (code `auth/requires-password-reauth`)
  - `isAuthRequiresRecentLoginError(error: unknown): boolean`
  - `isAuthRequiresPasswordError(error: unknown): boolean`
  - `IAuthService.deleteAccount(): Promise<void>`
  - `IAuthService.reauthenticateWithGoogle(): Promise<void>`
  - `IAuthService.reauthenticateWithEmail(password: string): Promise<void>`
  - `IAccountCloudStore.deleteUserData(uid: string): Promise<void>`

- [ ] **Step 1: Extend `authErrors.ts`**

Append:

```typescript
export const AUTH_REQUIRES_RECENT_LOGIN_CODE = 'auth/requires-recent-login';
export const AUTH_REQUIRES_PASSWORD_REAUTH_CODE = 'auth/requires-password-reauth';

export class AuthRequiresRecentLoginError extends Error {
  readonly code = AUTH_REQUIRES_RECENT_LOGIN_CODE;

  constructor(message = 'Sign in again to delete your account.') {
    super(message);
    this.name = 'AuthRequiresRecentLoginError';
  }
}

export class AuthRequiresPasswordError extends Error {
  readonly code = AUTH_REQUIRES_PASSWORD_REAUTH_CODE;

  constructor(message = 'Enter your password to delete your account.') {
    super(message);
    this.name = 'AuthRequiresPasswordError';
  }
}

export function isAuthRequiresRecentLoginError(error: unknown): boolean {
  if (error instanceof AuthRequiresRecentLoginError) return true;
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return code === AUTH_REQUIRES_RECENT_LOGIN_CODE;
}

export function isAuthRequiresPasswordError(error: unknown): boolean {
  if (error instanceof AuthRequiresPasswordError) return true;
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return code === AUTH_REQUIRES_PASSWORD_REAUTH_CODE;
}
```

- [ ] **Step 2: Extend `IAuthService`**

```typescript
export interface IAuthService {
  signInWithGoogle(): Promise<AuthUser>;
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  createAccountWithEmail(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  reauthenticateWithGoogle(): Promise<void>;
  reauthenticateWithEmail(password: string): Promise<void>;
  getCurrentUser(): AuthUser | null;
  subscribe(callback: (user: AuthUser | null) => void): () => void;
}
```

- [ ] **Step 3: Extend `IAccountCloudStore`**

Add:

```typescript
  /** Idempotent: removes users/{uid} tree (devices, entitlement, profile doc). */
  deleteUserData(uid: string): Promise<void>;
```

- [ ] **Step 4: Stub adapter methods so the project typechecks**

In `FirebaseAuthServiceAdapter`, add temporary:

```typescript
  async deleteAccount(): Promise<void> {
    throw new Error('Not implemented');
  }
  async reauthenticateWithGoogle(): Promise<void> {
    throw new Error('Not implemented');
  }
  async reauthenticateWithEmail(_password: string): Promise<void> {
    throw new Error('Not implemented');
  }
```

In `FirestoreAccountCloudStoreAdapter`:

```typescript
  async deleteUserData(_uid: string): Promise<void> {
    throw new Error('Not implemented');
  }
```

Update `__tests__/syncAccountProfile.test.ts` `makeCloud` to include `deleteUserData: async () => {}`.

- [ ] **Step 5: Verify TypeScript / tests still run**

Run: `yarn test __tests__/syncAccountProfile.test.ts --coverage=false`  
Expected: PASS

---

### Task 2: Firestore `deleteUserData`

**Files:**
- Modify: `src/infrastructure/adapters/FirestoreAccountCloudStoreAdapter.ts`
- Modify: `src/infrastructure/adapters/FirestoreAccountCloudStoreAdapter.ts` module loader (add `deleteDoc`)

**Interfaces:**
- Consumes: existing Firestore module pattern in that file
- Produces: working `deleteUserData(uid)` deleting:
  - all `users/{uid}/devices/*`
  - `users/{uid}/entitlement/current`
  - `users/{uid}`

- [ ] **Step 1: Extend Firestore module typing**

In `getFirestoreModule`, also import `deleteDoc` from `@react-native-firebase/firestore` and expose:

```typescript
deleteDoc: (ref: unknown) => Promise<void>;
```

Wire it like `setDoc` / `getDocs`.

- [ ] **Step 2: Implement `deleteUserData`**

```typescript
  async deleteUserData(uid: string): Promise<void> {
    const db = getFirestoreModule();
    if (!db) {
      throw new Error('Cloud storage is unavailable on this build.');
    }
    try {
      const devicesSnap = await withTimeout(
        db.getDocs(db.collection('users', uid, 'devices')),
        FIRESTORE_TIMEOUT_MS,
        'deleteUserData.devices'
      );
      for (const d of devicesSnap.docs) {
        await withTimeout(
          db.deleteDoc(db.doc('users', uid, 'devices', d.id)),
          FIRESTORE_TIMEOUT_MS,
          'deleteUserData.device'
        );
      }
      await withTimeout(
        db.deleteDoc(db.doc('users', uid, 'entitlement', 'current')),
        FIRESTORE_TIMEOUT_MS,
        'deleteUserData.entitlement'
      ).catch(() => {
        /* entitlement doc may not exist */
      });
      await withTimeout(
        db.deleteDoc(db.doc('users', uid)),
        FIRESTORE_TIMEOUT_MS,
        'deleteUserData.user'
      ).catch(() => {
        /* user doc may already be gone */
      });
    } catch (e) {
      recordCrashError(e, 'FirestoreAccountCloudStoreAdapter.deleteUserData');
      throw new Error('Could not delete cloud account data.');
    }
  }
```

Note: `devicesSnap.docs` entries need `.id` — if the current `getDocs` typing only returns `data()`, extend the snap type to `{ docs: Array<{ id: string; data: () => T | undefined }> }` matching RN Firebase.

- [ ] **Step 3: Confirm listDevices snap already exposes doc ids**

If not, adjust `getDocs` mapping / typing so delete can use document ids from the query snapshot.

---

### Task 3: Firebase Auth delete + reauth

**Files:**
- Modify: `src/infrastructure/adapters/FirebaseAuthServiceAdapter.ts`

**Interfaces:**
- Consumes: `IAuthService` new methods; Google sign-in helpers already in file
- Produces: real `deleteAccount` / `reauthenticateWithGoogle` / `reauthenticateWithEmail`

- [ ] **Step 1: Extend AuthModule**

Add to the lazy-loaded auth require:

```typescript
deleteUser: (user: MinimalFirebaseUser) => Promise<void>;
reauthenticateWithCredential: (
  user: MinimalFirebaseUser,
  credential: AuthCredentialLike
) => Promise<unknown>;
```

Import `deleteUser` and `reauthenticateWithCredential` from `@react-native-firebase/auth` (modular API used by this project).

Also need a way to get the **native** current user object that supports delete (not only mapped `MinimalFirebaseUser`). Prefer storing/using `instance.currentUser` from Firebase Auth as the object passed to `deleteUser` / `reauthenticateWithCredential`.

- [ ] **Step 2: Implement `deleteAccount`**

```typescript
  async deleteAccount(): Promise<void> {
    const auth = requireAuth();
    const user = auth.currentUser();
    if (!user) {
      throw new Error('Not signed in');
    }
    try {
      await auth.deleteUser(user as MinimalFirebaseUser & object);
    } catch (e) {
      const code =
        e && typeof e === 'object' && 'code' in e
          ? String((e as { code: unknown }).code)
          : '';
      if (code === 'auth/requires-recent-login') {
        throw new AuthRequiresRecentLoginError();
      }
      throw mapAuthError(e, 'Could not delete account.');
    }
  }
```

Import `AuthRequiresRecentLoginError` from `authErrors`.

- [ ] **Step 3: Implement `reauthenticateWithGoogle`**

Mirror `signInWithGoogle` credential acquisition, then:

```typescript
await auth.reauthenticateWithCredential(user, credential);
```

Throw `AuthCancelledError` on cancel. Do **not** call `signInWithCredential` (that would switch users).

- [ ] **Step 4: Implement `reauthenticateWithEmail`**

```typescript
  async reauthenticateWithEmail(password: string): Promise<void> {
    const auth = requireAuth();
    const user = auth.currentUser();
    if (!user?.email) {
      throw new Error('Not signed in with email.');
    }
    if (!password) {
      throw new Error('Enter your password.');
    }
    try {
      const credential = auth.EmailAuthProvider.credential(
        normalizeEmail(user.email),
        password
      );
      await auth.reauthenticateWithCredential(user, credential);
    } catch (e) {
      throw mapAuthError(e, 'Could not verify password.');
    }
  }
```

Add `EmailAuthProvider: { credential: (email: string, password: string) => AuthCredentialLike }` to AuthModule (from `@react-native-firebase/auth`).

---

### Task 4: `DeleteAccountUseCase` + tests (TDD)

**Files:**
- Create: `src/domain/useCases/DeleteAccountUseCase.ts`
- Create: `__tests__/deleteAccountUseCase.test.ts`
- Modify: `src/di.ts`

**Interfaces:**
- Consumes: `IAuthService`, `IAccountCloudStore`, `ResetPurchasesUserUseCase`, `SignOutUseCase` (only `clearLocalSession`)
- Produces: `DeleteAccountUseCase.execute(options?: { emailPassword?: string }): Promise<void>`

- [ ] **Step 1: Write failing tests**

```typescript
import { DeleteAccountUseCase } from '../src/domain/useCases/DeleteAccountUseCase';
import {
  AuthRequiresPasswordError,
  AuthRequiresRecentLoginError,
} from '../src/domain/errors/authErrors';
import type { IAuthService } from '../src/domain/ports/IAuthService';
import type { IAccountCloudStore } from '../src/domain/ports/IAccountCloudStore';
import type { AuthUser } from '../src/types';

function makeAuth(overrides: Partial<IAuthService> & { user?: AuthUser | null } = {}) {
  let user: AuthUser | null =
    overrides.user === undefined
      ? {
          uid: 'u1',
          email: 'a@b.com',
          displayName: null,
          providers: ['google'],
        }
      : overrides.user;
  const auth: IAuthService = {
    signInWithGoogle: async () => user!,
    signInWithEmail: async () => user!,
    createAccountWithEmail: async () => user!,
    signOut: async () => {},
    deleteAccount: async () => {},
    reauthenticateWithGoogle: async () => {},
    reauthenticateWithEmail: async () => {},
    getCurrentUser: () => user,
    subscribe: () => () => {},
    ...overrides,
  };
  return { auth, setUser: (u: AuthUser | null) => { user = u; } };
}

describe('DeleteAccountUseCase', () => {
  it('deletes cloud then auth then clears local session', async () => {
    const order: string[] = [];
    const { auth } = makeAuth({
      deleteAccount: async () => {
        order.push('auth');
      },
    });
    const cloud: IAccountCloudStore = {
      getProfile: async () => null,
      upsertProfile: async () => {},
      listDevices: async () => [],
      upsertDevice: async () => {},
      setDeviceActive: async () => {},
      getEntitlement: async () => null,
      setEntitlement: async () => {},
      deleteUserData: async () => {
        order.push('cloud');
      },
    };
    const resetPurchases = { execute: async () => { order.push('rc'); return null as never; } };
    const signOut = { clearLocalSession: () => { order.push('local'); return { localPremiumKept: false }; } };

    const useCase = new DeleteAccountUseCase(
      auth,
      cloud,
      resetPurchases as never,
      signOut as never
    );
    await useCase.execute();
    expect(order).toEqual(['cloud', 'auth', 'rc', 'local']);
  });

  it('reauths with Google once on requires-recent-login then deletes', async () => {
    let attempts = 0;
    const { auth } = makeAuth({
      deleteAccount: async () => {
        attempts += 1;
        if (attempts === 1) throw new AuthRequiresRecentLoginError();
      },
      reauthenticateWithGoogle: async () => {
        attempts += 10;
      },
    });
    // ... cloud + reset + signOut stubs ...
    // expect delete succeeded and reauthenticateWithGoogle called
  });

  it('throws AuthRequiresPasswordError when password reauth needed and no password', async () => {
    const { auth } = makeAuth({
      user: {
        uid: 'u1',
        email: 'a@b.com',
        displayName: null,
        providers: ['password'],
      },
      deleteAccount: async () => {
        throw new AuthRequiresRecentLoginError();
      },
    });
    // ...
    await expect(useCase.execute()).rejects.toBeInstanceOf(AuthRequiresPasswordError);
  });
});
```

Fill the stub comments with the same cloud/reset/signOut pattern as the first test.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `yarn test __tests__/deleteAccountUseCase.test.ts --coverage=false`  
Expected: FAIL (module / class missing)

- [ ] **Step 3: Implement `DeleteAccountUseCase`**

```typescript
/**
 * DeleteAccountUseCase — remove Firebase Auth user + Firestore users/{uid} tree,
 * then RC logOut + clearLocalSession (keep local progress / local purchase proof).
 */

import type { IAuthService } from '../ports/IAuthService';
import type { IAccountCloudStore } from '../ports/IAccountCloudStore';
import type { ResetPurchasesUserUseCase } from './ResetPurchasesUserUseCase';
import type { SignOutUseCase } from './SignOutUseCase';
import {
  AuthRequiresPasswordError,
  AuthRequiresRecentLoginError,
  isAuthRequiresRecentLoginError,
} from '../errors/authErrors';

export type DeleteAccountOptions = {
  emailPassword?: string;
};

export class DeleteAccountUseCase {
  constructor(
    private readonly auth: IAuthService,
    private readonly cloud: IAccountCloudStore,
    private readonly resetPurchasesUser: ResetPurchasesUserUseCase,
    private readonly signOut: SignOutUseCase,
    private readonly onError?: (error: unknown, context: string) => void
  ) {}

  async execute(options: DeleteAccountOptions = {}): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) {
      throw new Error('Not signed in');
    }
    const uid = user.uid;

    await this.cloud.deleteUserData(uid);

    try {
      await this.auth.deleteAccount();
    } catch (e) {
      if (!isAuthRequiresRecentLoginError(e)) {
        throw e;
      }
      await this.reauthenticateOnce(options.emailPassword);
      await this.cloud.deleteUserData(uid);
      await this.auth.deleteAccount();
    }

    try {
      await this.resetPurchasesUser.execute();
    } catch (e) {
      this.onError?.(e, 'DeleteAccountUseCase.resetPurchases');
    }

    this.signOut.clearLocalSession();
  }

  private async reauthenticateOnce(emailPassword?: string): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) {
      throw new AuthRequiresRecentLoginError();
    }
    if (user.providers.includes('google')) {
      await this.auth.reauthenticateWithGoogle();
      return;
    }
    if (user.providers.includes('password')) {
      if (!emailPassword) {
        throw new AuthRequiresPasswordError();
      }
      await this.auth.reauthenticateWithEmail(emailPassword);
      return;
    }
    throw new AuthRequiresRecentLoginError();
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `yarn test __tests__/deleteAccountUseCase.test.ts --coverage=false`  
Expected: PASS

- [ ] **Step 5: Wire `di.ts`**

```typescript
import { DeleteAccountUseCase } from './domain/useCases/DeleteAccountUseCase';

export const deleteAccountUseCase = new DeleteAccountUseCase(
  authService,
  accountCloudStore,
  resetPurchasesUserUseCase,
  signOutUseCase,
  recordCrashError
);
```

Place after `signOutUseCase` definition (needs `signOutUseCase` already constructed).

---

### Task 5: Hook + Account screen UI

**Files:**
- Modify: `src/hooks/useAccountActions.ts`
- Modify: `src/surfaces/app/AccountScreen.tsx`

**Interfaces:**
- Consumes: `deleteAccountUseCase` from `di`
- Produces: `deleteAccount: (emailPassword?: string) => Promise<void>` on the hook

- [ ] **Step 1: Hook `deleteAccount`**

```typescript
import {
  // ...
  deleteAccountUseCase,
} from '../di';
import {
  isAuthCancelledError,
  isAuthRequiresPasswordError,
} from '../domain/errors/authErrors';

  const deleteAccount = useCallback(
    async (emailPassword?: string): Promise<void> => {
      await runAction(async () => {
        try {
          await deleteAccountUseCase.execute(
            emailPassword ? { emailPassword } : {}
          );
        } catch (e) {
          if (isAuthRequiresPasswordError(e)) {
            throw e; // AccountScreen prompts then retries with password
          }
          throw e;
        }
      });
    },
    [runAction]
  );

  // return { ..., deleteAccount }
```

- [ ] **Step 2: AccountScreen handlers**

Below Sign out button, add Delete account. Copy from spec:

```typescript
  const { ..., deleteAccount } = useAccountActions();

  const runDeleteAccount = async (emailPassword?: string) => {
    try {
      await deleteAccount(emailPassword);
      void logAnalyticsEvent('account_deleted');
    } catch (e) {
      if (isAuthRequiresPasswordError(e)) {
        // iOS: Alert.prompt; Android: set showPasswordModal state
        if (Platform.OS === 'ios') {
          Alert.prompt(
            'Confirm password',
            'Enter your password to delete your account.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: (password?: string) => {
                  if (!password) return;
                  void runDeleteAccount(password);
                },
              },
            ],
            'secure-text'
          );
          return;
        }
        setPasswordForDeleteVisible(true);
        return;
      }
      // error already on hook
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This removes your UNTIL account and cloud data. Progress on this phone stays. Purchases stay with your Apple ID.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void logAnalyticsEvent('account_delete_started');
            void runDeleteAccount();
          },
        },
      ]
    );
  };
```

For Android password modal: minimal `Modal` + `TextInput` secure + Cancel / Delete, then `runDeleteAccount(password)`.

UI button (after Sign out):

```tsx
              <TouchableOpacity
                style={[styles.deleteButton, { borderColor: theme.glassBorder }]}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Delete account"
              >
                <Text variant="body" style={{ color: '#C62828' }}>
                  Delete account
                </Text>
              </TouchableOpacity>
```

Style: same as `signOutButton` with `marginTop: Spacing[3]`.

- [ ] **Step 3: Manual check list (device)**

1. Sign in with Google → Delete account → confirm → signed out; DOB still set.  
2. Sign in with email → Delete with fresh session.  
3. Sign in, wait or force recent-login path → Google reauth sheet → delete succeeds.  
4. Email + stale session → password prompt → delete succeeds.

---

### Task 6: Privacy policy one-liner

**Files:**
- Modify: `website/src/domain/legal/privacy.ts` (rights section body)

- [ ] **Step 1: Update rights copy**

Change the rights body to include in-app deletion, e.g.:

```typescript
body: `Depending on your location, you may have rights to access, correct, delete, or port your data, or to object to or restrict processing. In the App, signed-in users can delete their account under Settings → Account. You can also contact us at ${contactEmail}, or uninstall the App and clear local storage.`,
```

- [ ] **Step 2: Redeploy website later** (ops note; not blocking app binary)

---

## Spec coverage check

| Spec item | Task |
|-----------|------|
| Confirm UI + copy | Task 5 |
| Firestore wipe then Auth delete | Tasks 2–4 |
| Reauth once (Google / password) | Tasks 3–5 |
| RC logOut + clearLocalSession | Task 4 |
| Keep local progress | Task 4 (clearLocalSession only) |
| Unit tests | Task 4 |
| Privacy mention | Task 6 |

## Placeholder scan

None intentional. Adapter Firebase modular APIs must match the versions already required in `FirebaseAuthServiceAdapter` / `FirestoreAccountCloudStoreAdapter` — implementers should mirror existing `require()` patterns, not invent a second Auth API style.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-20-delete-account.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement task-by-task in this session with checkpoints  

Which approach?
