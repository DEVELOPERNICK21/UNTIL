# UNTIL desktop

Mac menu bar extra and Windows tray companion. Built with Tauri 2.

Needs Node 20+ and Rust (`https://rustup.rs`).

```bash
cd desktop
npm install
npm run tauri dev
```

The extra shows a dash until you sign in with a birth date. Click it to open the panel. Closing the panel hides it. Right-click the extra to quit.

Shared code comes from the phone app through the `@until/*` alias (`../src`). Desktop code must not import phone `di`, persistence, hooks, surfaces, or infrastructure. `__tests__/desktopBoundary.test.ts` enforces this.
