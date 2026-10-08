# Apple Watch

The watch app has eight pages you swipe between. Today, Month, Year and Life are worked out from the watch clock, so they stay right with the phone out of reach. Streak, Tasks, Counter and the Hour timer come from the phone over WatchConnectivity. (The old circular Day % complication is not part of the current Xcode project; see "Complications" below.)

**Wear OS parity:** see [`docs/WEAR_OS.md`](./WEAR_OS.md). It has not had this redesign yet.

Design: [`docs/superpowers/specs/2026-07-14-apple-watch-day-design.md`](./superpowers/specs/2026-07-14-apple-watch-day-design.md) is the original Day-only spec. The current look is described below.

---

## Pages

| Page | Visual | Hero | Source |
|------|--------|------|--------|
| Today | Hill from sunrise to moon with a glowing sticker at the time of day | Time left (`8h 25m`) | Watch clock |
| Month | Calendar dots, weekday aligned | Days left | Watch clock |
| Year | 270 degree gauge with a glowing knob | Days left | Watch clock |
| Life | One block per decade | Years left (`43.6`) | Birth date and plan from the phone |
| Streak | Seven dots with weekday letters | Days in a row | Phone |
| Tasks | Donut and category rows | `3/5` | Phone |
| Counter | Wave above a minus and plus pill | Count | Phone (first custom counter, like the widget) |
| Hour timer | Hour bar, play/pause and reset | Timer | Phone (shared with the widget and Dynamic Island) |

Rules: one visual and one hero number per page, with at most one line of new information. The same wording and rounding as the widgets (`watchOneDecimal`, month and year counts include today).

**Stickers.** Each page has an emoji sticker that follows the state (time of day, moon phase, season, tasks done, minutes focused). Tap it to move to the next of three packs; the pack is kept on the watch (`until.watch.stickerPack`). Tables live in `WatchStickers.swift`.

**Look.** Black with a soft wash of the page's colour (`WatchPageBackground`), light rounded numerals, glass rows, glow on the number and gauges. The wash and glows switch off when the watch dims (`isLuminanceReduced`). Nothing animates by itself: pages update every 30 seconds, and the running timer counts up with `Text(date, style: .timer)`.

---

## What’s in the repo

| Path | Role |
|------|------|
| `ios/UNTIL/WatchConnectivityBridge.swift` | Phone side: builds one context from the App Group and pushes it; answers the watch's timer and counter taps |
| `ios/UNTIL/UNTILLiveActivityAttributes.swift` | `HourTimerStore`, the timer storage shared by the island, widget and watch |
| `ios/UNTILWatchShared/` | Pure Foundation logic: `WatchExtras`, `WatchPeriodMath`, `WatchStickers`, day cache, clocks. Tested by `ios/WatchMath` |
| `ios/UNTILWatch Watch App/` | The watch app target (SwiftUI). **It keeps its own copies of the shared files**; copy changes over (`cp UNTILWatchShared/X.swift "UNTILWatch Watch App/"`) |
| `ios/WatchMath/` | Swift package whose sources are symlinks to `UNTILWatchShared`. Run `swift test` in that folder (macOS, 36 tests) |
| `ios/UNTILWatch/` | Old copy of the watch app. Not in the project; ignore it |

Pages: `WatchPages.swift` (Today, Month, Year, Life), `WatchPhonePages.swift` (Streak, Tasks, Counter, Timer), `WatchGauges.swift` (drawings), `WatchTheme.swift` (colours and small pieces), `TimeHubView.swift` (the pager), `UNTILWatchApp.swift` (receiver).

### App icon (App Review rejected a black one)

`ios/UNTILWatch Watch App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png` is a single 1024 x 1024 image with no transparency. watchOS crops it to a circle on a black home screen, so **the background must be clearly lighter than black** or the circle disappears. App Review (guideline 4, October 2026) rejected a near-black icon for exactly this. The current icon is an amber-to-orange gradient (`#FFB038` to `#E85810`) with a cream sun and a soft halo. Keep the mark in the middle so the circle does not cut it, and check any new icon cropped to a circle on black at 60 px before submitting.

The iPhone icon (`ios/UNTIL/Images.xcassets`) is separate and is not subject to this rule.

### Complications

`ios/UNTILWatchWidgets/` is not a target of the Xcode project and its main file is a half-merged template, so there is no complication today. Adding one means creating the widget extension target in Xcode first (steps below).

---

## Xcode setup (only needed to add a complication)

The watch app target already exists: `UNTILWatch Watch App`, bundle ID `com.developernick.until.watchapp`, App Group `group.com.developernick.until.watchkit` (`DayWatchCache.suiteName`). The steps below are from the first version and use its old names; follow them only to add the widget extension for a complication, and use the real IDs above.

1. Open `ios/UNTIL.xcworkspace` in Xcode.
2. **File → New → Target…**
   - **watchOS → App**
   - Product Name: `UNTILWatch`
   - Bundle ID: `com.develoeprnick.UNTIL.watchkitapp` (companion of `com.develoeprnick.UNTIL`)
   - Embed in: **UNTIL**
   - Language: SwiftUI · Interface: SwiftUI
3. **Delete** any sample files Xcode generated. Add existing files instead:
   - `UNTILWatch/UNTILWatchApp.swift`
   - `UNTILWatch/DayDetailView.swift`
   - `UNTILWatch/Info.plist`
   - `UNTILWatch/UNTILWatch.entitlements`
   - `UNTILWatchShared/DayWatchCache.swift`
   - `UNTILWatchShared/Color+Hex.swift`
4. Target **UNTILWatch** build settings:
   - Info.plist = `UNTILWatch/Info.plist`
   - Code Signing Entitlements = `UNTILWatch/UNTILWatch.entitlements`
   - Deployment: watchOS 10+
5. **File → New → Target… → Widget Extension**
   - Name: `UNTILWatchWidgets`
   - Embed in: **UNTILWatch** (not the iPhone app)
   - Include Configuration Intent: **No**
6. Replace generated widget sources with:
   - `UNTILWatchWidgets/UNTILWatchWidgets.swift`
   - `UNTILWatchWidgets/Info.plist`
   - `UNTILWatchWidgets/UNTILWatchWidgets.entitlements`
   - Same shared files: `DayWatchCache.swift`, `Color+Hex.swift` (target membership: Watch + Widgets)
7. **Signing & Capabilities** for **UNTILWatch** and **UNTILWatchWidgets**:
   - Add **App Groups** → `group.com.develoeprnick.UNTIL.watch`
   - Must match `DayWatchCache.suiteName`
8. In Apple Developer portal, create the App Group and enable it for the Watch App ID if Xcode cannot auto-create it.
9. Select a **Watch + iPhone** simulator pair (or a paired device). Build **UNTIL** (Watch app embeds automatically).

---

## How to test

1. Run UNTIL on the paired iPhone simulator or device, and install the watch app on the paired watch (Xcode does this when you run the `UNTIL` scheme with a paired watch).
2. Open the app once so the widget cache syncs. Swipe through the pages: Life needs a birth date, Streak, Tasks and Counter need data in the app.
3. Hour timer: press play on the watch. The Dynamic Island and the home screen widget should start counting too. Press pause on the island; the watch should follow within a moment.
4. Counter: press plus on the watch; the counter widget should show the new count, and the app after you open it.
5. Put the phone out of range and press play: the watch should say "Open UNTIL on iPhone" and change nothing.
6. Force-quit and reinstall the watch app: pages that need the phone show a "Open UNTIL on iPhone" notice until the next sync.

### Accessibility (required for App Review)

On the Watch: **Settings → Accessibility → Text Size**, slide to the largest size, then look at every page.

- Text must grow with the system setting.
- Nothing may be clipped by the screen edge. Pages scroll when they need to.
- Every page reads as one sentence with VoiceOver (`accessibilityLabel`); the drawings are hidden from it.

---

## Sync payload

The phone pushes one `WCSession` application context with every field (each push replaces the last):

| Group | Keys |
|-------|------|
| Day and life | `dayProgress`, `dayPercentDone`, `dayPercentLeft`, `startOfDay`, `endOfDay`, `dayHoursLeft`, `dayRemainingMinutes`, `birthDate`, `deathAge`, `updatedAt` |
| Streak | `streakCount`, `streakDots` (7 booleans, oldest first), `streakAsOfMs` |
| Tasks | `tasksCompleted`, `tasksTotal`, `taskCategories` (`{key: [completed, total]}`) |
| Counter | `counterId`, `counterTitle`, `counterCount` |
| Timer | `timerTitle`, `timerRunning`, `timerStartMs`, `timerElapsedMs` |

It is built from the App Group (`widget.cache`, `daily.tasks.widget`, `custom.counters`, `hour.calculation.widget`), so it works while React Native is not running. `WidgetBridge` pushes again when tasks or the timer change, and `HourTimerStore.changedNotification` pushes when a Dynamic Island button changes the timer.

Watch to phone messages (`sendMessage`, need the phone reachable):

| `type` | Payload | Reply |
|--------|---------|-------|
| `until.watch.refresh` | none | `ok` |
| `until.watch.timer` | `action`: `toggle` or `reset` | timer fields |
| `until.watch.counter` | `id`, `change` (+1 or -1) | counter fields |

The phone owns the timer and counters. The watch never changes them on its own, and shows "Open UNTIL on iPhone" when it cannot reach the phone. The app adopts the new counter and timer values at launch and whenever it comes to the foreground: `syncCustomCountersAfterAdopting` (counter) and `adoptNativeHourTimer` (timer) in `WidgetSync.ts`. The counter has to be read from the App Group *before* the app pushes its own, otherwise the push overwrites the taps made on the watch or the widget (this used to happen).

The streak dots are worked out on the phone when it last synced; the watch moves them on by the days since (`WatchStreak.aligned`).

---

## Previewing the pages

Debug builds take launch arguments so each page can be opened with sample data:

```bash
xcrun simctl launch <watch udid> com.developernick.until.watchapp -untilWatchDemo -untilWatchPage streak
```

Pages: `today month year life streak tasks counter timer`. Build only the watch app with

```bash
xcodebuild -project ios/UNTIL.xcodeproj -target "UNTILWatch Watch App" -configuration Debug -sdk watchsimulator CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- DEVELOPMENT_TEAM=
```

(Building the scheme also builds the iPhone app, which needs the workspace.)

---

## Next

- A complication target (Day, Streak)  
- Deadlines page  
- Wear OS version of the redesign  
