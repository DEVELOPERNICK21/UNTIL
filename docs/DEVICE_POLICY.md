# Device policy — where premium works and how slots are managed

One account, one premium, up to **5 devices** at once. This page is the single description of the rules. The numbers live in code (`features/account/domain/deviceLimit.ts`) and every user-facing sentence is built from them (`accountCopy.ts`), so changing the limit is a one-line change plus a test run.

## Rules

| Rule | Value | Where |
|------|-------|-------|
| Devices per account | 5 (`MAX_ACTIVE_DEVICES`) | `domain/deviceLimit.ts` |
| Mac / Windows PC at a time | 1. A second computer asks to turn the first one off | `planDesktopRegister` |
| A device nobody opened for 90 days (`STALE_DEVICE_DAYS`) | Stops using a slot. It claims one again the next time it opens, if one is free | `isDeviceStale`, used by `canRegisterDevice` |
| Re-signing in on a device that already has a slot | Never takes another | `canRegisterDevice` |
| Sign out | Gives this device's slot back first, best effort (5 s budget, never blocks sign-out) | `ReleaseThisDeviceUseCase` via `SignOutUseCase` |
| Remove a device (Account → Devices) | Deactivates it, keeps its history. If the freed slot lets this phone in, it registers and rebinds premium at once | `RemoveAccountDeviceUseCase` |
| A Mac / Windows PC that was removed | Signs itself out on its next refresh (15 min) | `desktop/src/session.ts` |
| A phone that was removed | Learns on launch, and when the app returns to the foreground after 6 h or more | `useAuthBootstrap` |
| Network or Firestore error while checking | Leaves premium exactly as it was. Only a real "limit reached" answer revokes it | `isConclusiveRegistration` |

The device list shows, per device: type icon, name, platform, app version, "Active now / today / 3 days ago", a "This device" badge, and "N of 5 in use". The pure view is `domain/deviceList.ts`; the screen is `ui/AccountDevicesSection.tsx`.

## What this does not protect against (known gaps)

1. **The cap is enforced by the app, not the server.** A modified client can write extra `users/{uid}/devices/*` documents. Firestore rules cannot count a collection.
2. **The entitlement document is writable by its owner.** `users/{uid}/entitlement/current` is how the Mac / Windows app learns about premium, and the rules let the signed-in user write it, so a determined person can mark their own account premium. Phones are not affected because RevenueCat is the source of truth there.
3. **Two devices registering in the same second can both succeed** (read the list, then write), briefly going over the cap.
4. **A removed phone that is still signed in re-claims a free slot** the next time it opens. Removing a lost phone frees its slot, but it does not sign the phone out.

## Closing them (server side)

- A RevenueCat webhook to a Cloud Function that writes `entitlement/current`, with the rule changed to `allow read` only for the owner. This fixes (2) and is the standard way to share a store purchase with a platform that has no store.
- A callable Cloud Function `registerDevice` that counts devices in a transaction and is the only writer of `devices/*`. This fixes (1), (3) and, with a `revokedAt` tombstone the phone checks on launch, (4).

Both need Firebase Functions (Blaze plan) and a RevenueCat webhook secret, so they are separate work from the app change.
