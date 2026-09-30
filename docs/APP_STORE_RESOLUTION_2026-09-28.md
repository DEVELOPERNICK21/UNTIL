# App Store Resolution Center reply · 2026-09-28

Rejection: Guideline 4.8 (Login Services), submission 4e0b27f0-623c-434f-a6b6-cf87bc94297d, UNTIL 1.0 (5).

Fix: Sign in with Apple added on iOS, shown above Google on both sign-in screens. Ship as a **new build** (e.g. 1.0 (6)), then reply below.

## Before uploading the new build

1. **Apple Developer → Identifiers → com.developernick.until** (main app ID) → enable **Sign in with Apple** → Save. Regenerate / refresh provisioning profiles (Xcode automatic signing does this; Codemagic needs its profile re-fetched).
2. **Firebase console → project until-b7624 → Authentication → Sign-in method → Apple** → Enable. For native iOS only, no Services ID or key is needed. For token revocation on account deletion, also fill in **Apple Team ID, Key ID and private key** (a Sign in with Apple key from Apple Developer → Keys) under the Apple provider's "OAuth code flow configuration".
3. Build on a real device, tap **Continue with Apple** on the account screen, confirm sign-in and account deletion both work.
4. Build number is bumped to 6 in the Xcode project (all targets). Upload, then attach build 1.0 (6) to version 1.0.

## Reply (paste into Resolution Center)

```text
Hello App Review team,

Thank you for the feedback on submission 4e0b27f0-623c-434f-a6b6-cf87bc94297d.

Guideline 4.8 - Login Services

UNTIL now offers Sign in with Apple as an equivalent login option on iOS and iPadOS. It appears above Continue with Google on both sign-in screens:

- After the Premium screen, on the "Keep your data with you" prompt
- Settings > Account

Sign in with Apple lets users keep their email address private (Hide My Email), limits data collection to name and email, and we do not use it for advertising. Signing in is optional; the app works fully without an account.

Account deletion (Settings > Account > Delete account) also revokes the Sign in with Apple token.

This is addressed in build 1.0 (6).

Thank you,
Nick
```

## App Review Information → Notes (add to existing notes)

```text
Sign-in is optional. Options on iOS: Sign in with Apple, Google, or email.
Path: Settings > Account > Continue with Apple.
```
