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

## Releasing

`.github/workflows/desktop-release.yml` builds a universal Mac `.dmg` and a
Windows `-setup.exe`, signs the update bundles, and publishes a GitHub Release
on `DEVELOPERNICK21/UNTIL`. The website picks it up within 10 minutes:

- `/download/mac` and `/download/windows` redirect to the newest installer
  (the landing page `#desktop` section links there).
- `/api/desktop/update` redirects installed apps to the release's `latest.json`.
  Until the first release it returns 204 (no update).

To ship a version:

1. Bump `"version"` in `src-tauri/tauri.conf.json` (and `package.json`).
2. Commit, then `git tag desktop-vX.Y.Z && git push origin desktop-vX.Y.Z`.
   The workflow fails if the tag and the config version differ.
3. Deploy the website once (after the routes land) so the endpoints exist.

Test builds: Actions > Desktop release > Run workflow. Installers are attached
to the run, nothing is published. The button only appears once the workflow
file is on the default branch.

### Updater key (do not lose it)

The keypair was generated with `npx tauri signer generate -w ~/.tauri/until-desktop.key`
(no password). The public key is in `tauri.conf.json` > `plugins.updater.pubkey`.

- Back up `~/.tauri/until-desktop.key` somewhere safe (password manager).
  Without it, installed copies can never update again.
- Never commit it.

### GitHub secrets (Settings > Secrets and variables > Actions)

Required:

| Secret | Value |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | contents of `~/.tauri/until-desktop.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | empty |
| `VITE_GOOGLE_DESKTOP_CLIENT_ID` | from `.env.local` |
| `VITE_GOOGLE_DESKTOP_CLIENT_SECRET` | from `.env.local` |

Mac signing (optional; without it Gatekeeper blocks the app):

| Secret | Value |
|---|---|
| `APPLE_CERTIFICATE` | base64 of the Developer ID Application `.p12` |
| `APPLE_CERTIFICATE_PASSWORD` | `.p12` export password |
| `APPLE_SIGNING_IDENTITY` | e.g. `Developer ID Application: Name (TEAMID)` |
| `APPLE_ID` | Apple ID email |
| `APPLE_PASSWORD` | app-specific password (appleid.apple.com) |
| `APPLE_TEAM_ID` | 10-character team ID |

Windows signing (optional; without it SmartScreen warns), via Azure Trusted
Signing:

| Secret | Value |
|---|---|
| `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` / `AZURE_TENANT_ID` | app registration with the Trusted Signing Certificate Profile Signer role |
| `TRUSTED_SIGNING_ENDPOINT` | e.g. `https://eus.codesigning.azure.net` |
| `TRUSTED_SIGNING_ACCOUNT` | Trusted Signing account name |
| `TRUSTED_SIGNING_PROFILE` | certificate profile name |

### Unsigned builds

Fine for testing with friends, not for the landing page.

- Mac: right-click UNTIL.app > Open, or System Settings > Privacy & Security >
  Open Anyway.
- Windows: SmartScreen > More info > Run anyway.

### Checks per release

1. Fresh Mac that never ran `tauri dev`: install from the `.dmg`, the ring shows
   in the menu bar.
2. Fresh Windows: install from `-setup.exe`, the ring shows in the tray.
3. Install the previous version, wait for the update check (on launch), confirm
   "Update ready" then restart lands on the new version.

## Out of v1

Larger window, Linux.
