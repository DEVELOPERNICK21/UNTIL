# Dynamic Island and Lock Screen activity (iOS)

One Live Activity (`UNTILLiveActivityAttributes`) with six views: Today, Month, Year, Life, Tasks, Hour timer.
It only starts when the user presses **Start** on the Dynamic Island screen. `updateActivity` never starts one.

If it is not showing, see [When the island does not show](#when-the-island-does-not-show).

## How it stays live with the app closed

| Thing on screen | How it updates |
|-----------------|----------------|
| Time left today | `Text(timerInterval:)`, ticks by itself |
| Today's bars, timer bar | Drawn from the state; refreshed whenever the island updates (app opens, island buttons) |
| Hour timer | `Text(startDate, style: .timer)`; `hourCalcStartMs` is in the state |
| Day counts, tasks, % left | Pushed from JS when the app opens or returns to the foreground |

No continuous animation and no per-second timelines. Content goes stale at the end of the day (`staleDate`), and the Lock Screen shows "Open UNTIL to refresh".

## Look: one design per view

Each view has its own artwork, colour and glow (`IslandDayArt`, `IslandMonthArt`, `IslandYearArt`, `IslandLifeArt`, `IslandTasksArt`, `IslandTimerArt`), all picked by `IslandArt`:

| View | Artwork | Glow |
|------|---------|------|
| Today | Glowing countdown over six four-hour bars coloured like the sky; the current bar is filled to the share elapsed | Sky colour by time of day |
| Month | Days left over one bar per week | Teal |
| Year | Days left over four quarter bars, each with a season sticker | Blue |
| Life | Years left over one track with a heart at the share lived | Rose |
| Tasks | One cell per task, green and checked when done | Green |
| Hour timer | Glowing timer, a bar for the current hour, round pause and reset buttons | Violet and cyan |

Glow is cheap on purpose: radial gradients behind stickers and `.shadow` on small shapes only.

### Stickers

The sticker (top left, and inside the compact and minimal forms) is an emoji that follows the state: time of day, moon phase, season, share of life, tasks done, minutes focused. Tapping it runs `CycleIslandStickerIntent`, which moves to the next of three packs (`IslandStickers`). The pack is kept in `ContentState.stickerPack` and in the App Group (`liveActivity.stickerPack`) so the app's own updates keep it. Keep the three packs different at every stage.

### Fit

- The artwork gets a fixed box (`IslandMetrics.visualHeight`), so switching views never resizes the island. The expanded island is only about 160 pt tall; add a row and the chips get clipped, which also makes them untappable.
- Chips share the available width, so the row fits any phone. Subtitles stay under about 14 characters. Titles are cut with an ellipsis.
- `Text(timerInterval:)` is greedy. On the compact island it is pinned to 58 pt; static text uses `fixedSize()`.

## Keep the renderer cheap (this made the island laggy)

Measured on the simulator, `WidgetRenderer_Activities` CPU per 8 seconds with the hour timer running:

| Build | CPU |
|-------|-----|
| Bar fills itself with `ProgressView(timerInterval:)` | 1.2 s |
| Plain bar drawn from the state | 0.17 s |

The self-advancing bar is about 7x the cost of a plain one, and it moves under a pixel a minute, so every bar is drawn from the state at each update (`IslandBand`, `IslandModel.bandPiece`). Rules:

- **Do not use `ProgressView(timerInterval:)` or `Text(timerInterval:)` with a range that started long ago.** SwiftUI walks the schedule from the start of the range up to now. A three-month range kept the renderer at 100% CPU until iOS killed it and the island froze on the last good frame.
- Count up with `Text(startDate, style: .timer)` (no schedule to walk). Count down with `Text(timerInterval: now...end)`; it is the only timer range in the island.
- No `.shadow` on text that ticks. The glow is a radial gradient behind the number, drawn once.
- Redraw cost scales with what changes per second. Only the countdown or stopwatch number should.
- To check: sample `ps -o time= -p <pid of WidgetRenderer_Activities>` over 8 s with each view showing. Month, year, life and tasks sit at 0; today and the timer should stay near 0.2 s.

## Buttons (iOS 17+)

Intents live in `ios/UNTIL/UNTILLiveActivityAttributes.swift` so both targets compile them (a `LiveActivityIntent` runs in the app process).

- `SwitchIslandModeIntent(mode:)`: the icon chips. Month and Life are Premium; `ContentState.isPremium` decides, so free users get a lock that opens the paywall.
- `ToggleIslandTimerIntent` and `ResetIslandTimerIntent`: start/stop and reset the hour timer. They act on the timer the island is showing (not on the shared copy), then save it to the same App Group JSON as the home screen widget.
- `CycleIslandStickerIntent`: next sticker pack.

All of them update the island first and do their bookkeeping after, so the tap feels instant. `AppDelegate` skips Firebase and the React Native boot when iOS wakes the app in the background just to run an intent, and starts them when the user really opens the app (or a link arrives). A cold tap now costs about 100 ms in the app; later taps take 2 to 3 ms. Timings are logged under subsystem `com.developernick.until`, category `island`.

Both work while the app is closed. On the next foreground, `refreshLiveActivity()` (`WidgetSync.ts`) copies the chosen view and the timer state back into the app before it pushes new numbers, so the app never overwrites what the user did on the island.

## Deep links

`AppDelegate` forwards `until://` URLs to `RCTLinkingManager`; without that the links were ignored. Taps open the matching screen through `until://open/<Screen>` (`src/services/deepLinks.ts`, allow-listed): DayDetail, MonthDetail, YearDetail, Life, DailyTasks, HourCalculation, Badges, Premium.

## Testing on the simulator

- Build with `CODE_SIGN_IDENTITY="-" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=YES`. With `CODE_SIGNING_ALLOWED=NO` Xcode drops the entitlements, MMKV cannot open the App Group and the app crashes at launch. Hand-signing with `codesign` keeps the app alive but the widget extension cannot see the App Group data.
- The first Lock Screen activity shows an iOS "Allow Live Activities?" prompt.
- Long-press the island to expand it; use the HOME button first, the island hides while the app is frontmost.

## When the island does not show

`LiveActivityBridge.startActivity` is a promise and rejects with `unsupported` (iOS older than 16.2), `disabled` (Live Activities off for UNTIL) or `failed`. The Dynamic Island screen turns that into a banner, and "Open settings" jumps to the app's iOS settings. `getStatus` reports `enabled` and `active`; an activity that iOS already ended (`ended`, `dismissed`) does not count as active.

Things that look like a bug but are not:

- **"Allow Live Activities from UNTIL?"** appears under the Lock Screen card the first time. Until the user taps Allow nothing reliable shows. The screen's hint says so.
- iOS ends a Live Activity after about 8 hours. If the user pressed Start and never Stop (`liveActivity.enabled`), `refreshLiveActivity()` starts it again on the next foreground. If it vanished well before that, the user dismissed it and it stays off.
- The Dynamic Island exists on iPhone 14 Pro and later. Other iPhones only get the Lock Screen card.
- A custom URL opened with `simctl openurl` shows an "Open in UNTIL?" sheet on the simulator.
- **Debug builds load JS from Metro on port 8081.** If another project's Metro owns that port, UNTIL shows that project's bundle (a red "module not found" screen). Run `npx react-native start --port 8090` here and point the simulator build at it with `xcrun simctl spawn booted defaults write com.developernick.until RCT_jsLocation localhost:8090`.
