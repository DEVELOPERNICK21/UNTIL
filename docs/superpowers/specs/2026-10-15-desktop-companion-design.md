# Desktop companion (Mac + Windows)

**Date:** 2026-10-15
**Status:** Approved
**Surface:** Mac menu-bar extra + Windows tray + compact panel (v1). Larger window is v1.1, out of this spec.
**Approach:** Tauri 2 companion beside the React Native phone app. Share `core/time` and `getProgressColor`. Firebase JS for auth, profile, devices, entitlement.

## Decisions

| Topic | Choice | Why |
|---|---|---|
| Product shape | Companion, not a phone clone | UNTIL is glanceable time. Extra/tray is the product; a full window can wait. |
| v1 vs later | Companion first. Larger window = v1.1 | Ship extra + panel. Do not spec the window here. |
| Stack | Tauri 2 | Small native extra/tray. Share TypeScript `core/`. Not RN macOS/Windows. |
| Folder | `desktop/` at repo root | Own composition root. Phone `di.ts` stays the phone root. |
| Premium | Desktop counts as one of 3 devices | Same account, same cap. Buy/restore stay on phone. |
| Slot mix | Any mix of 3 | Phones + Mac + Windows. Cap stays 3. |
| Desktop uniqueness | At most one active desktop | Signing into a new desktop replaces the previous Mac/Windows, even under the cap. |
| Replace confirm | Ask first | Cancel leaves the previous desktop active and does not complete sign-in here. |
| Extra | Always visible, day % 0–100 | Same `getProgressColor`. Signed out shows a dash, not a fake percent. |
| Panel | Compact Home echo | Day (with seconds), Month, Year, Life. Same formatters as Home. No Skia rings. |
| Sign-in | Google + Apple, same Firebase uid | Birth date once if missing. No desktop paywall in v1. |

## Product

### Goal

A Mac and Windows companion that keeps day % in the extra/tray and a compact panel of the same numbers as phone Home. Same Firebase account. Desktop consumes one of the 3 premium device slots, with at most one active desktop at a time.

### Who it is for

Someone already using UNTIL on a phone who wants the day percent in the menu bar or tray while they work. Not a first-run store for buying premium.

### User-facing behavior

1. Extra (Mac menu bar) and tray (Windows) always show.
   - Signed in with a birth date: day percent 0–100, colored with `getProgressColor(progress)`.
   - Signed out, or no birth date: a dash. Not 0. Not a guessed percent.
2. Click extra or tray opens a compact panel.
3. Panel lists Day (passed / left, seconds), Month, Year, Life using the same formatters as phone Home.
4. Sign in with Google or Apple. Same account as the phone. If birth date is missing, collect it once.
5. Premium buy and restore stay on the phone. Desktop reads entitlement. Numbers still show if the account is not premium. No desktop paywall in v1.
6. Signing into a second distinct desktop asks before replacing the previous one. Cancel aborts this machine’s sign-in. Same device id reopening does not prompt.
7. Phone Account lists Mac and Windows so the user can turn one off.

### Copy

User-facing strings follow the human-copy rules (no em dashes, no coach clichés). Concrete product words.

**Replace dialog**

```
UNTIL is already signed in on [label]. Signing in here turns that one off.
```

Buttons: `Continue` · `Cancel`

If `label` is empty, use `Mac`, `Windows`, or `another computer` from the previous device’s platform.

**Device cap (already on phone, keep this wording)**

```
This account is already used on 3 devices. Remove one to unlock premium here.
```

**Phone copy change**

`SIGN_IN_BENEFITS` in `AccountScreen.tsx` and `AccountPromptScreen.tsx` currently says `Premium on up to 3 phones`. Change to `Premium on up to 3 devices`. Account heading already says `Up to 3 devices per account.` Keep that.

**Extra signed-out**

A dash. Not `0%`. Not a placeholder percent.

## Architecture

```
desktop/                          Tauri 2 companion (this spec)
  src/                            React panel UI
  src-tauri/                      extra, tray, window, native shell
  di.ts                           desktop composition root

UNTIL/src/                        phone app (unchanged root)
  core/time                       shared formatters (extract from HomeScreen)
  theme/progressColor.ts          getProgressColor SSOT
  types/auth.ts                   AccountDevice.platform += macos | windows
  core/account/deviceLimit.ts     desktop-replace helpers
  domain/useCases/                RegisterDeviceUseCase grows a desktop path
  surfaces/                       phone only; desktop does not import screens
```

Phone `di.ts` stays the phone composition root. Desktop wires Firebase JS adapters in `desktop/src/di.ts`. Desktop does not import `src/surfaces`, MMKV, Skia, Notifee, widgets, island, overlay, or RevenueCat.

### Shared vs desktop-only

| Shared as TypeScript | Desktop-only | Phone-only (v1) |
|---|---|---|
| `core/time` (incl. extracted Home formatters) | Tauri extra/tray | Skia rings, island, overlay |
| `getProgressColor` | Firebase JS SDK | RevenueCat IAP, Notifee |
| `AccountDevice`, device-limit helpers | Local disk profile cache | MMKV, widgets |
| Firestore `users/{uid}` shape | Stable desktop `deviceId` (UUID in app data) | `src/surfaces` screens |

### Data model

`AccountDevice.platform` becomes `'ios' | 'android' | 'macos' | 'windows'`.

Firestore `users/{uid}/devices/{deviceId}` already stores `platform`. Existing docs stay `ios` / `android`. New desktop docs write `macos` or `windows`.

Desktop `deviceId`: generate a UUID on first launch, persist in Tauri app data. Same id on later launches. Reinstall may mint a new id; that counts as a new desktop and may prompt replace.

### Layer rules

- Panel UI may import `core/time`, `theme/progressColor`, domain **types**. Not phone hooks, not phone `di.ts`, not `persistence`.
- Desktop adapters implement the same ports the phone uses (`IAccountCloudStore` shape, register/remove device). Desktop composition root instantiates them.
- Use cases that need a confirm step (replace-previous-desktop) must not deactivate first. Confirm is a UI gate; the use case receives an explicit `replaceConfirmed` (or a dedicated `ReplaceDesktopDeviceUseCase`) after the user continues.

### Register-device rules

`MAX_ACTIVE_DEVICES` stays 3. Phone-to-phone still hard-caps.

Desktop path, in order:

1. **Same device id** already in the list (active or not): register / refresh `lastSeenAt`. No prompt.
2. **Another active `macos` or `windows`** with a different id: do not register yet. Return `{ needsReplace: true, existing: AccountDevice }`. UI shows the replace dialog.
   - Continue: `setDeviceActive(uid, oldId, false)`, then register this machine.
   - Cancel: previous desktop stays active. This machine does not complete sign-in (no slot claimed here). Firebase session may exist. Extra stays on a dash until a successful register, unless this machine already had a local profile from a prior session.
3. **No prior active desktop**, `canRegisterDevice` allows: register this machine (`macos` or `windows`).
4. **No prior active desktop**, already 3 active (typically 3 phones): `limit_reached`. Do not replace a phone to make room.

Replace happens even when under the cap. One phone + one Mac, then sign in on Windows: deactivate the Mac, register Windows. Result is still two slots, one of them desktop.

`IAccountCloudStore.setDeviceActive` already exists for the deactivate step.

`RegisterDeviceUseCase.getPlatform` today is `() => 'ios' | 'android'`. Expand to `'ios' | 'android' | 'macos' | 'windows'`. Phone wiring unchanged. Desktop wiring returns `macos` or `windows`.

Phone `CompleteAccountSignInUseCase` stays the phone path (session, age confirm, profile, register, entitlement, 12s budget). Desktop sign-in is its own flow in the desktop composition root: session → age confirm if needed → list devices → replace dialog if needed → register → read entitlement. Same 12s budget spirit: session can exist; slot may still be unclaimed.

### Desktop sign-in (decided during build)

Provider pages never load inside the webview. Sign-in goes through the system browser (RFC 8252):

- **Google:** Desktop OAuth client. Rust opens a one-shot listener on `127.0.0.1:<free port>`, the browser redirects there with a code, Rust exchanges it with PKCE (Google's token endpoint has no CORS for the webview). The id token goes to `signInWithCredential`.
- **Apple:** the desktop keeps a raw nonce and opens `website/public/desktop-sign-in.html` with its SHA-256 and a `state`. The page runs Sign in with Apple JS (Services ID) and returns the id token through `until-desktop://auth?state=..&id_token=..`. `OAuthProvider('apple.com').credential({ idToken, rawNonce })`.
- After sign-in, if the profile lacks the 13+ confirmation or a birth date, the panel asks once (shared `ageGate` rules). A Firebase user created on this machine that backs out before confirming is deleted.
- The panel re-reads its own device doc on focus and every 15 minutes. If the slot was turned off (replaced or removed on the phone) it signs out and shows a dash.

### Fail closed / fail open (match phone)

- List or write failure: `read_failed` / `write_failed`. Not conclusive. Do not strip premium on a network error (`isConclusiveRegistration` stays as today).
- `limit_reached` is conclusive.
- Offline extra/panel: last profile on disk, numbers keep ticking. Sign-in and limit check wait for network.
- Extra never invents a percent.

### Home formatters (must extract)

These four functions live in `HomeScreen.tsx` today (approx. lines 72–139). Extract into `src/core/time/homeFormatters.ts`, re-exported from `src/core/time/index.ts`. Phone Home and desktop panel both import them. Do not duplicate.

- `formatDayPassedLeftWithSeconds`
- `formatMonthPassedLeft`
- `formatYearPassedLeft`
- `formatLifePassedLeft`

Day strings are `Xh Ym Zs`. Month/year/life use passed/left days and percents as Home does now.

## UI

### Extra (Mac) / tray (Windows)

```
[ 42% ]     signed in, color from getProgressColor
[  —  ]     signed out or no birth date
```

Mac: menu-bar extra, click opens the panel.
Windows: tray icon (small glyph with the percent or a dash; color matches). Click opens the panel.

No progress bar in the extra. Extra stays visible while the companion process is running, including signed-out.

### Panel

Compact Home echo. Not Settings. Not full Home/Life.

```
UNTIL
Day     8h 12m 4s passed    15h 47m 55s left
Month   …                   …
Year    …                   …
Life    …                   …

[ Sign in with Google ]
[ Sign in with Apple ]
```

When signed in, replace the buttons with account email (or a short signed-in state) and a way to sign out. No store IAP UI.

### Replace dialog

Title/body as Copy above. Continue / Cancel. Blocker in the sign-in flow, not a silent toast.

### Phone Account

List Mac and Windows with a readable label (`device.label`, else `Mac` / `Windows`). Remove still uses `RemoveAccountDeviceUseCase`. `deviceLabel()` today treats unknown platform as Android phone; that must not swallow `macos` / `windows`.

## Out of scope (v1)

- Larger desktop window (v1.1)
- Skia rings, Dynamic Island, overlay, home-screen widgets
- Desktop RevenueCat / Play / App Store IAP / paywall
- Notifications (Notifee) on desktop
- Multiple concurrent desktops
- Replacing a phone to free a slot for desktop
- Launch-at-login as a required product toggle (companion only shows extra while it is running; OS login-item can be a later polish)
- Auto-update / notarization / Authenticode as product features (needed to ship; tracked in rollout, not in the extra/panel UX)

## Testing

### Device limit / register

- Same desktop device id: register, no prompt.
- Fourth distinct phone: `limit_reached`.
- Active Mac, sign in on Windows after Continue: old Mac `active: false`, Windows registered.
- Cancel replace: old desktop still active; this machine not registered.
- Three phones, no desktop: desktop sign-in is `limit_reached` (does not deactivate a phone).
- One phone + one Mac, Windows Continue: still two active devices, only one desktop.

### Extra

- 0–100 when signed in with birth date.
- Dash when signed out.

### Panel

- Formatters match Home for a fixture profile (same strings and percents).

### Copy

- No `3 phones` in sign-in benefits.
- Replace dialog uses the agreed lines.

### Not in v1 desktop tests

Island, overlay, widgets, Skia, store IAP on desktop.

## Success criteria

- Extra/tray visible on Mac and Windows with day % or a dash.
- Panel Day / Month / Year / Life match phone Home for the same profile and clock.
- Desktop register consumes a slot; at most one active `macos`/`windows`.
- Replace asks first; Cancel does not steal the previous desktop.
- Three phones still block a new desktop.
- Phone Account can list and remove Mac/Windows.
- Network failures do not strip premium.
- `npm run lint` layer rules still hold: desktop UI does not import phone `di` or `persistence`.

## Rollout

1. Extract Home formatters into `src/core/time/`. Phone tests still pass.
2. Widen `AccountDevice.platform`. Phone `deviceLabel` + `SIGN_IN_BENEFITS`. Device-limit tests for replace / 4th phone / cancel.
3. Scaffold `desktop/` Tauri 2: extra/tray, panel shell, local profile disk, tick loop.
4. Firebase JS auth (Google + Apple) + desktop register/replace flow.
5. Entitlement read (no purchase).
6. Mac + Windows signed builds (notarization / Authenticode) when shipping outside local run.

Ship extra + panel before any v1.1 window work.
