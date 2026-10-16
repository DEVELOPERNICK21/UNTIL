# UNTIL desktop: standards checklist (macOS and Windows)

Status: **done** (in the repo and tested), **needs credentials** (config is ready, a secret is missing), **open** (not done, with the reason). Sources are the official Tauri v2 docs (signing, installer, CSP, capabilities, updater), Apple's notarization documentation and Microsoft's notification-area guidance. `__tests__/desktopStandards.test.ts` checks the items marked (test).

## Both platforms

| Standard | Status |
|----------|--------|
| Content Security Policy set; same-origin by default, no remote script, `object-src 'none'`, connect only to the Tauri bridge and the Google endpoints Firebase uses; looser policy only in `devCsp` (test) | done. Checked by serving the release build with the policy and loading panel, notch and widget views: no violations; a probe to another host was blocked. Sign-in and Firestore sync were not exercised under the policy; if a Firebase call is blocked, the console names the host to add |
| Least-privilege capabilities: one file per window group, no `*` window, updater/restart/autostart/opener on the panel only, no remote URLs (test) | done |
| Signed, verified updates (minisign pubkey in config, HTTPS endpoint, private key only in CI) | done |
| Loopback OAuth with PKCE and `state`; secrets out of git | done |
| Open at login is opt-in: asked once, never switched on silently (test) | done (was on by default) |
| Esc closes the panel; Cmd/Ctrl+Q quits; tray left click toggles, right click menu has Quit | done |
| Version and Privacy / Terms links in the panel (URLs from `config/monetization` `LEGAL_URLS`) | done |
| Text contrast at least 4.5:1 in both colour schemes (test); keyboard focus rings; reduced motion respected (test) | done (muted text colour raised to pass) |
| Single instance, deep links through the single-instance plugin | done |
| Real signing identity and notarization on every release | needs credentials |
| Crash and error reporting without personal data | open: none yet; decide on a vendor and consent first |
| `freezePrototype`, isolation pattern, per-command `AppManifest` limits | open: considered, but they can break Firebase and the dynamic window creation; try behind a test build |

## macOS

| Standard | Status |
|----------|--------|
| Developer ID Application certificate, hardened runtime on, secure timestamp, no `get-task-allow`; notarize and staple (`APPLE_CERTIFICATE`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`) | needs credentials. `hardenedRuntime: true` is explicit (test); the workflow turns signing on when the secrets exist and warns when not |
| `LSUIElement` in `Info.plist` so there is no Dock icon from the first frame (test) | done |
| `minimumSystemVersion` declared (11.0) (test) | done |
| Universal binary (arm64 and x86_64) | done |
| Launch at login through the launch-agent plugin, and the toggle shows the real state | done |
| Menu bar icon with tooltip, notch island only on Macs with a notch | done |
| No entitlements needed outside the App Store sandbox (WKWebView needs no JIT entitlement) | done |

## Windows

| Standard | Status |
|----------|--------|
| Authenticode signing through Azure Trusted Signing in CI; SmartScreen reputation builds with each signed release (EV no longer gives instant reputation) | needs credentials |
| NSIS installer, per-user (`currentUser`: no admin prompt), publisher and Start-menu folder named, WebView2 bootstrapper (test) | done |
| Tray icon with tooltip, left click opens the panel, right click menu with Quit; icon has 16 and 32 px sizes | done |
| High Contrast (forced colors) styles for panel and widgets (test) | done |
| Windows smoke test in CI on test builds | done |
| Optional: winget manifest, MSIX | open: after the first signed release |

## Release gate to add once credentials exist

macOS: `codesign --verify --deep --strict`, `spctl -a -t exec -vv`, `xcrun stapler validate` on the `.app`. Windows: `Get-AuthenticodeSignature` must report `Valid` on the setup exe. Both should fail the job. Not added yet because they cannot be tested without the certificates.
