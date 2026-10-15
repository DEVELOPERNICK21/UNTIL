# Shipping UNTIL desktop

Not product UI. What has to exist before someone else can run a build.

## One-time console setup (sign-in)

Firebase project `until-b7624` already has the web app "UNTIL desktop". Its
config is in `src/config.ts` (public by design).

### Google

1. Google Cloud Console, project `until-b7624` > APIs & Services > Credentials >
   Create credentials > OAuth client ID > **Desktop app**. Name it "UNTIL desktop".
2. Copy the client ID and secret into `desktop/.env.local` (see `.env.example`).
   Desktop clients accept any `http://127.0.0.1:<port>` redirect, so nothing else
   to register. Firebase accepts the id token because the client is in the same
   project.

### Apple

1. developer.apple.com > Identifiers > **Services IDs** > new:
   `app.until.time.signin` (must match `APPLE_SERVICES_ID` in
   `website/public/desktop-sign-in.html`).
2. Enable Sign in with Apple on it, primary App ID `app.until.time`.
   - Domain: `developernick1-until.vercel.app`
   - Return URL: `https://developernick1-until.vercel.app/desktop-sign-in.html`
3. Firebase Console > Authentication > Sign-in method > Apple: set **Services
   ID** to `app.until.time.signin`. iOS bundle-ID tokens keep working.
4. Deploy the website so `desktop-sign-in.html` is live.

### API key

If the Firebase "Browser key" has HTTP referrer restrictions, allow the Tauri
origins: `tauri://localhost` (Mac) and `http://tauri.localhost` (Windows).

## Testing sign-in locally

- Google works under `npm run tauri dev`.
- Apple returns through `until-desktop://`. Mac only registers that scheme for a
  bundled app: `npm run tauri build -- --debug`, then open the `.app` from
  `src-tauri/target/debug/bundle/macos/`. Windows registers it at runtime, so
  `tauri dev` works there.

## Mac

1. Apple Developer ID Application certificate.
2. `cd desktop && npm run tauri build -- --target aarch64-apple-darwin` (and
   `x86_64-apple-darwin` if you ship Intel).
3. Notarize the `.app` / `.dmg` (`xcrun notarytool`). Staple.
4. Gatekeeper: open on a Mac that never ran `tauri dev`. The extra should show.

## Windows

1. Authenticode certificate.
2. `cd desktop && npm run tauri build -- --target x86_64-pc-windows-msvc`
3. Sign the `.exe` / `.msi`.
4. SmartScreen may warn until reputation builds.

## Out of v1

Launch at login, auto-update, larger window.
