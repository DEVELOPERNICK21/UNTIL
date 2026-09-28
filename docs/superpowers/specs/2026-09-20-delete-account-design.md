# Delete Account — Design Spec

**Date:** 2026-09-20  
**App:** UNTIL (React Native)  
**Goal:** In-app account deletion for App Store Guideline 5.1.1 / App Review info requests.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Local data | Clear account-linked session only; keep DOB, settings, time progress, local purchase proof |
| Reauth | Confirm → try delete → on `requires-recent-login`, reauth once and retry |
| Cloud | Delete Firebase Auth user + full Firestore `users/{uid}` tree; RevenueCat `logOut` (no RC customer purge API) |

## Problem

UNTIL supports Google and email/password account creation. Settings → Account only offers sign-out. Apple requires account deletion in apps that support account creation, and App Review asked to demonstrate it in a screen recording.

## Non-goals

- Wipe local day/month/year/life progress or settings
- Server-side RevenueCat customer deletion
- Apple Sign In (not shipped yet)
- Soft-delete / retain Firestore history for deleted users

## User flow

1. Signed-in user opens **Settings → Account**.
2. Taps **Delete account** (destructive).
3. Confirm alert:
   - Account and cloud data are deleted.
   - Local progress and settings stay on this device.
   - Store purchases stay with the Apple ID; Restore may recover premium later.
4. On confirm: show busy state; run delete pipeline.
5. Success: user is signed out; Account screen shows signed-out state.
6. Failure (non-reauth): show error; stay signed in.
7. Failure (`auth/requires-recent-login`): trigger provider reauth (Google sheet or email password prompt as applicable), then retry delete **once**. If still failing, show error.

## Architecture

Follow existing layers: Screen → Hook → Use Case → Ports → Adapters.

```
AccountScreen
  → useAccountActions.deleteAccount()
    → DeleteAccountUseCase.execute()
        → IAccountCloudStore.deleteUserData(uid)
        → IAuthService.deleteAccount()
            [on requires-recent-login]
            → IAuthService.reauthenticate() then deleteAccount() again
        → ResetPurchasesUserUseCase (RC logOut)
        → SignOutUseCase.clearLocalSession()  // do not call auth.signOut again if Auth user already gone
```

### Port changes

**`IAuthService`**
- `deleteAccount(): Promise<void>` — deletes current Firebase Auth user
- `reauthenticate(): Promise<void>` — recent-login for current provider (Google credential refresh, or email/password re-entry via a small UI callback / dedicated method)

Email reauth needs the password: prefer `reauthenticateWithEmail(password: string)` plus Google `reauthenticateWithGoogle()`, or a single `reauthenticate(options)` from the use case after the UI collects password when provider is password.

**`IAccountCloudStore`**
- `deleteUserData(uid: string): Promise<void>` — delete `users/{uid}` document and subcollections (`devices`, entitlement docs, profile as stored today)

### Use case

**`DeleteAccountUseCase`**
1. Resolve current uid; throw if not signed in.
2. `deleteUserData(uid)` (best-effort log + continue or fail-closed: **fail-closed** if Firestore delete fails, so we do not orphan Auth without cloud wipe intent — prefer delete Firestore first, then Auth).
3. `deleteAccount()` on Auth.
4. Catch recent-login error → ask hook/UI for reauth → retry steps 2–3 once (Firestore may already be empty; make deleteUserData idempotent).
5. `resetPurchasesUser.execute()` (ignore soft failures after Auth is gone; log).
6. `signOutUseCase.clearLocalSession()` — same premium-keep rules as sign-out (`hasLocalPurchaseProof`).

Order rationale: remove cloud data while Auth token is still valid for Firestore rules; then delete Auth; then local/RC cleanup.

### Hook / UI

- `useAccountActions`: `deleteAccount()` wrapping the use case; for email users, if reauth needed, prompt for password (Alert + TextInput is awkward on RN — use a small confirm modal already patterned in app, or `Alert.prompt` on iOS only and a simple modal on Android). Prefer one shared password field modal if email provider.
- `AccountScreen`: destructive button below Sign out; confirm `Alert.alert` with Cancel / Delete.

### Copy (human, no AI slop)

- Button: `Delete account`
- Confirm title: `Delete account?`
- Confirm body: `This removes your UNTIL account and cloud data. Progress on this phone stays. Purchases stay with your Apple ID.`
- Confirm action: `Delete`
- Error: short plain message from use case / Firebase

### Analytics (optional, thin)

- `account_delete_started` / `account_deleted` / `account_delete_failed` via existing analytics helper if easy; otherwise skip in v1.

## Firestore shape (current)

- `users/{uid}` — profile  
- `users/{uid}/devices/{deviceId}`  
- entitlement under same tree as today  

`deleteUserData` must remove subcollections then parent (client-side batch/recursive delete). Document any rules assumption: user can only delete their own `users/{uid}` tree.

## Security / App Review

- Deletion is user-initiated and confirmed.
- Demo account in App Review Notes must be deletable or use a fresh account per review cycle.
- Privacy policy already mentions contacting support for deletion; after ship, update privacy to mention in-app Delete account (follow-up, not blocking).

## Testing

- Unit: `DeleteAccountUseCase` with mocked ports (happy path, Firestore fail, recent-login then success, already-deleted Firestore idempotent).
- Manual: Google delete; email delete; recent-login path; confirm local DOB remains; confirm signed-out UI; Restore Purchases still works if they had IAP.

## Implementation order

1. Ports + Firestore `deleteUserData` + Auth `deleteAccount` / reauth  
2. `DeleteAccountUseCase` + `di` wiring  
3. Hook + AccountScreen UI  
4. Tests  
5. Privacy one-liner update (optional same PR)

## Open points (resolved)

- None for v1. Email password reauth UI: use platform-appropriate prompt as above.
