# UNTIL desktop

Mac menu bar extra and Windows tray companion. Built with Tauri 2.

Needs Node 20+ and Rust (`https://rustup.rs`).

```bash
cd desktop
npm install
npm run tauri dev
```

Sign-in needs `desktop/.env.local` and the console setup in `SHIP.md`.

The extra shows a dash until you sign in with a birth date. Click it to open the panel. Closing the panel hides it. Right-click the extra to quit.

## The panel

Day, Month, Year and Life sit in a row of chips. Pick one (click it, press 1 to 4, or use the arrow keys) and the dial shows it: a ring for how far through you are, a mark around it for each hour, day, month or decade, and the time left in the middle. Click the dial to flip between time left and time passed. Ember, the same living time stone as the phone, sits in the corner: it watches the pointer, smiles when clicked and wakes up each time the panel opens. The panel follows the Mac's light or dark look, using the phone's palettes.

## The notch island (Macs with a notch)

On a Mac with a notch the app also draws an island that grows out of the notch, in the style of the iPhone's Dynamic Island.

- **Folded (compact):** a capsule hanging below the notch. Ember sits on the left of the notch and the number for the chosen view on the right ("9h 17m, left today"). Under the notch a bar shows how far through you are, with the view's sticker.
- **Open:** rest the pointer on the island and a card grows out of the notch. Click a sticker along the bottom to switch view: Today, Month, Year, Life, or the Hour timer. Each view has its own colour, dial and sticker, as on the phone's island. The folded capsule shows the same view, and the choice is remembered. Click anywhere else on the card to open the full panel under the notch. Move away and it folds.
- **Hour timer:** start, pause and reset, kept locally. It keeps running while the island is folded and shows in the capsule. Tasks, the phone's other island view, needs the phone's task list and is not on the desktop.

The right-click menu on the extra has two switches: "Show in the notch" (the island at all) and "Show time beside the notch" (the compact pill; off keeps the folded island to a thin line under the notch). Both are kept in `settings.json` in the app data folder. Macs without a notch never build the island.

How it works: `src-tauri/src/notch.rs` finds the notch from `NSScreen` (the gap between `auxiliaryTopLeftArea` and `auxiliaryTopRightArea`), puts a click-through window above the menu bar, and a small thread watches the pointer. The geometry and hover rules are plain functions with tests (`cargo test --lib`). The card is drawn by the same page as the panel (`?view=notch`, see `src/NotchIsland.tsx`). `CARD_W`, `CARD_H` and `EAR_W` in `notch.rs` must match `--card-w`, `--card-h` and `--ear` in `src/notch.css`.

To look at the island in a browser, run `npm run dev` and open `http://localhost:1420/?view=notch&nw=221&nh=38` (add `&open=1` for the open card, `&compact=0` for the thin line, `&mode=month` for a view).

## Desktop widgets

The phone's Day, Month, Year and Life widgets, as small windows that sit on the desktop below your other windows. Turn them on from the panel (the "Desktop widgets" card at the bottom) or from the right-click menu on the extra, under Widgets. A widget you turn on shows up at the right edge of the screen. By default widgets float above your windows so you can see them; untick "Keep them above my windows" to put them on the desktop behind everything, like the phone's home screen. "Show them now" (in the panel and the menu) raises them for a few seconds either way. Which widgets are on is remembered across restarts. Drag one by its body to move it; its place and size are remembered. Hover a widget for its buttons: open UNTIL, change size (Day only: small or wide) and close.

Today, Month and Year need no account, like the phone's widgets; Life needs your birth date, which comes from signing in (it then follows the phone). They redraw the moment the account data changes and tick on the whole minute, so the minutes change at the same moment as on the phone.

They are drawn like the phone widgets (`docs/WIDGETS.md`): purple for time passed, orange for now, one number per widget. Day is a ring with 24 hour dots and Ember in the middle; Month is a calendar lined up under the weekdays; Year has a dot for every day; Life has a dot for every year. Sizes match the iPhone's small (158 x 158) and medium (338 x 158).

How it works: `src-tauri/src/widgets.rs` makes one window per widget (`widget-day`, ...) and `src/DesktopWidget.tsx` draws it (`?view=widget&kind=day`). `src/widgetData.ts` works out the dots the same way `ios/UNTILWidgets/UNTILWidgets.swift` does. Choices live in `settings.json` (`src-tauri/src/settings.rs`). To look at one in a browser, sign in once in the dev page or seed `until.desktop.localState`, then open `http://localhost:1420/?view=widget&kind=month` with the window sized to 338 x 158.

## Sync with the phone

The Mac and Windows app use the same account as the phone. What follows the account:

- **Birth date and life expectancy.** Change them on the phone and the desktop updates within seconds (it listens to your account), and also re-reads on every open and every 15 minutes. The phone writes the change to your account as soon as you save it while signed in; if that fails (offline) it is sent again at the next launch.
- **Premium.** The desktop reads it from the account. Buying and restoring stay on the phone.
- **Which devices are signed in.** If a computer is turned off from the phone's Account screen, it signs out here.

The footer of the panel shows when it last heard from your account ("Synced 3 min ago") and has a **Sync now** button.

Not synced, because the phone keeps them on the phone only (they are not in your account): tasks, counters, streaks and badges, and the phone's hour timer. The desktop island has its own hour timer. Syncing those would mean storing them in your account, which needs a decision about privacy and Firestore rules first.

## Windows notes

- There is always a way to quit: **Quit UNTIL** in the panel, **Quit UNTIL** in the tray icon's right-click menu, or Ctrl+Q with the panel open. Windows may hide the tray icon behind the little arrow in the taskbar.
- Creating a window from a synchronous command or from a menu event hangs the app on Windows. Widgets are therefore created from an `async` command and from a background thread. The release workflow checks this on a real Windows machine: for test builds it runs the built app with `UNTIL_SMOKE_TEST=1` (`src-tauri/src/smoke.rs`), which turns every widget on, checks the windows exist and quits.

Shared code comes from the phone app through the `@until/*` alias (`../src`). Desktop code must not import phone `di`, persistence, hooks, surfaces, or infrastructure. `__tests__/desktopBoundary.test.ts` enforces this.
