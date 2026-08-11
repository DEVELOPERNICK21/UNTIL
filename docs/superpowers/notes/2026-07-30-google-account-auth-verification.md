# Google Account Auth — Verification (2026-07-30)

Plan: `docs/superpowers/plans/2026-07-30-google-account-auth.md`  
Spec: `docs/superpowers/specs/2026-07-30-google-account-auth-design.md`

## Automated

Command: `yarn test __tests__/deviceLimit.test.ts __tests__/accessControl.test.ts __tests__/registerDevice.test.ts`

| Result | Count |
|--------|-------|
| Suites passed | 4 |
| Tests passed | 20 |
| Failures | 0 |

Covers: 3-device cap logic, access control (premium gating when over limit), device registration.

## Manual checklist

| Item | Status | Notes |
|------|--------|-------|
| Fresh install → onboarding → AccountPrompt → skip confirm → Home, no uid | NOT RUN | Skip path does not need Google OAuth; needs on-device smoke. |
| AccountPrompt → Google → uid set, DOB in Firestore | BLOCKED | `GOOGLE_WEB_CLIENT_ID` is still `<MISSING_GOOGLE_WEB_CLIENT_ID>` (`UNTIL_GOOGLE_WEB_CLIENT_ID` unset). Firebase console OAuth clients not configured. |
| Settings → Account → sign out → sign in again | BLOCKED | Same OAuth placeholder. |
| 3 devices registered; 4th signs in → premium blocked + banner; remove one → unlock | BLOCKED | Requires Google sign-in on multiple devices. |
| Unsigned local Play premium still works (skip path) | NOT RUN | Needs Play billing on a physical device or emulator; no OAuth required. |
| Signed-in user with local purchase → entitlement doc written | BLOCKED | Requires Google sign-in + Play purchase restore. |

## Unblock manual QA

1. Create Firebase Google Sign-In OAuth clients (Web client ID for `@react-native-google-signin/google-signin`).
2. Set `UNTIL_GOOGLE_WEB_CLIENT_ID` in `.env` (or replace constant in `FirebaseAuthServiceAdapter.ts`).
3. Android: add debug SHA-1 to Firebase Android app (`E1:34:28:8A:BB:49:E3:4D:AE:4F:7E:76:56:2D:3C:86:F5:D5:7E:CA`), then re-download `google-services.json`.
4. iOS: URL scheme for reversed iOS client id in `Info.plist` (done if using repo setup).
5. Restart Metro (`yarn start --reset-cache`) and rebuild the app.
6. Re-run the manual rows above on at least two devices for the 4-device cap flow.

**2026-08-08:** Web client id wired in `.env`. Email/password is enabled in Firebase Console and built in the app.

**2026-08-08 hang fix:** Firestore / Play restore calls that never resolve left the login spinner stuck. Cloud ops now time out (~8s each) and complete-sign-in has a 12s budget so the UI can finish even if Firestore is not created yet. Still create a Firestore database in Firebase Console for sync/devices to work.

## Code fixes during verification

None. Automated suite passed without changes.
