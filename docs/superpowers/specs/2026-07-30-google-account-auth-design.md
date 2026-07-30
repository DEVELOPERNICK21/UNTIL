# Google Account Auth (Apple Later) — Design Spec

**Date:** 2026-07-30  
**Status:** Approved  
**Surface:** Post-onboarding account screen · Settings → Account · backend user + devices + entitlement  
**Approach:** Firebase Auth with Google first; stable `uid` owns profile + premium; max 3 devices hard-block; soft skip after onboarding

## Decisions

| Decision | Choice |
|----------|--------|
| Identity providers (phase 1) | Google Sign-In only |
| Identity providers (later) | Add Sign in with Apple; link to same `uid` |
| Identity key in app data | Firebase `uid` (never Google subject as permanent key) |
| Auth stack | Firebase Auth + synced user profile (Firestore) |
| Login after onboarding | Soft prompt; skip allowed |
| Login compulsory | No |
| Sign-in surfaces | (1) End of onboarding · (3) Settings → Account |
| Paywall forced login | Out of scope this phase |
| Skip UI | Very subtle text CTA + confirm sheet |
| Synced data | DOB, death age, core settings, premium entitlement |
| Subscription model | Migrate from device-bound → user-bound after sign-in + validated restore |
| Device limit | Max **3** active devices per `uid` |
| Over-limit behavior | Hard block premium on new device until user removes one |
| Over-limit sign-in | Allowed; profile sync may still work; premium blocked |

## Product

### Goals

1. Bind subscription and profile data (DOB, death age, settings) to an account so restore works across devices.
2. Push sign-in without blocking core app use.
3. Limit casual account sharing with a 3-device hard cap on premium.
4. Stay ready for Sign in with Apple once an Apple Developer membership exists (required for iOS App Store if Google is a primary third-party login).

### User-facing behavior

#### After onboarding (soft)

1. User finishes onboarding → account screen.
2. Primary CTA: `Continue with Google`.
3. Short support line: saves DOB, premium, and settings across devices.
4. Subtle bottom text: `Continue without account`.
5. If skip: confirm sheet before leaving.
   - Title idea: Without an account, data stays on this phone
   - Body: If you change phones or reinstall, DOB and premium may not come with you
   - Primary: `Sign in to keep it`
   - Subtle: `Continue anyway`
6. Skip → home as today (device-local data).

#### Settings → Account

1. Signed out: same Google CTA + short benefits copy.
2. Signed in: email / provider, sign out, device list, remove device.
3. Later: Link Apple (same `uid`).

#### Device limit (hard block)

1. On sign-in, register `deviceId` under the user if not already present.
2. If active devices already = 3 and this device is new:
   - Sign-in succeeds.
   - Premium stays blocked on this device.
   - Screen: account already used on 3 devices; remove one to unlock premium here.
3. User removes a device in Settings → Account.
4. Current device can then register and unlock premium (after entitlement check).

### Copy

- Follow human-copy rules (no em dashes, no coach filler).
- Prefer product words: account, sign in, DOB, premium, devices.
- Skip must stay visually quieter than Google CTA (muted, small, bottom).

## Architecture

```
UI (Account screen / Settings Account)
  → Auth hook / use cases
      → Firebase Auth (Google now; Apple later)
      → UserProfileRepository (Firestore users/{uid})
      → DeviceRegistry (users/{uid}/devices/{deviceId})
      → Entitlement bind (subscription ↔ uid)
  → Local SSOT remains TimeRepository / SubscriptionRepository (MMKV)
      sync down from cloud after auth
      sync up on profile / entitlement changes
```

### Stable identity

- Permanent key: Firebase `uid`.
- Google (and later Apple) are credentials attached to that `uid`.
- Do not create a second user when Apple is added; **link** the credential.

### Data model (Firestore)

```
users/{uid}
  birthDate
  deathAge
  settings (theme / small synced prefs)
  createdAt
  updatedAt

users/{uid}/devices/{deviceId}
  platform: ios | android
  label (optional)
  lastSeenAt
  createdAt
  active: true | false

users/{uid}/entitlement  (or equivalent subscription mapping)
  status
  source: play | app_store | license | none
  product / purchase type
  lastValidatedAt
```

### Local vs synced

**Sync:**
- DOB, death age
- Core preferences that should follow the user
- Premium entitlement for the `uid` (server-validated)

**Local-only (unless later needed):**
- Transient UI state
- Pure derived time calculations
- Easy-to-recompute caches

### Subscription migration (device → user)

Today premium can be device-scoped (MMKV / Play restore / license + `deviceId`).

After sign-in:

1. Validate purchase / license / Play entitlement (do not trust a bare local `premium=true` flag).
2. Bind validated entitlement to `uid`.
3. Register current `deviceId` if under the 3-device cap.
4. App reads premium for `uid` + “this device is an active registered device”.

Skipped users: keep current device-only behavior until they sign in from Settings.

### Device registration

Reuse existing stable device-id pattern (`IDeviceIdProvider` / license path).

Rules:
- Same physical device should reuse the same `deviceId` across launches when possible.
- Soft-deleted / removed devices free a slot.
- Premium gate: `entitlement.active && device.active && activeDeviceCount <= 3` for this device.

### Layer rules

- Surfaces: hooks, di, ui, theme, types only.
- Auth / Firestore adapters: infrastructure.
- Use cases own “sign in”, “register device”, “remove device”, “bind entitlement”, “sync profile”.
- Time SSOT stays `TimeRepository`; cloud sync writes through repository APIs, not ad-hoc MMKV from UI.

## UI details

### Post-onboarding account screen

1. Brand / short headline about keeping data with you
2. Primary: Continue with Google
3. One short benefit line
4. Subtle: Continue without account
5. Skip → confirm sheet → home or back to Google

### Settings Account

1. Auth state
2. Device list (name + last seen + remove)
3. Over-limit messaging when premium blocked for device count
4. Sign out

## Out of scope (this phase)

- Sign in with Apple (design for link later; ship after Apple Developer membership)
- Forced login on paywall
- Auto-kick oldest device
- Email / password auth
- Anonymous Firebase upgrade flows (optional later if needed)
- Changing Play Billing SKUs or paywall pricing

## Testing

- Fresh install → onboarding → Google sign-in → profile created; DOB synced.
- Skip path → confirm sheet → home; no Firebase user; local data works.
- Settings → sign in later → local DOB uploads / merges to `users/{uid}`.
- Device 1–3: premium works when entitled.
- Device 4: signed in, premium blocked, remove device then premium unlocks.
- Reinstall same device: same `deviceId` does not consume an extra slot.
- Existing Play / license premium: after validated restore + sign-in, entitlement attached to `uid`.
- Sign out: mark unauthenticated; stop treating cloud entitlement as active on this device until sign-in again. Local Play/license restore may still re-entitle the device for skipped/unsigned use, same as today.

## Success criteria

- User can skip after onboarding and use the app without an account.
- Signed-in users get DOB / settings / premium restored on another registered device (≤ 3).
- Fourth device cannot use premium until a device is removed.
- Auth layer is provider-agnostic so Apple can be added without remapping users.
- No App Store submission with Google-only as primary iOS login until Apple Sign-In is added (guideline 4.8).

## Rollout order

1. Firebase Auth + provider-agnostic auth use cases
2. Google Sign-In
3. User profile sync (DOB / death age / settings)
4. Device registry + 3-device hard block
5. Entitlement bind + device→user migration
6. Post-onboarding account screen + Settings Account
7. Later: Sign in with Apple + credential link
