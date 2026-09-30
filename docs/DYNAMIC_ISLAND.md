# Dynamic Island and Lock Screen activity (iOS)

One Live Activity (`UNTILLiveActivityAttributes`) with six views: Today, Month, Year, Life, Tasks, Hour timer.
It only starts when the user presses **Start** on the Dynamic Island screen. `updateActivity` never starts one.

## How it stays live with the app closed

| Thing on screen | How it updates |
|-----------------|----------------|
| Time left today | `Text(timerInterval:)`, ticks by itself |
| Day / month / year bar | `ProgressView(timerInterval:)`, advances by itself |
| Hour timer | `Text(origin, style: .timer)`; `hourCalcStartMs` is in the state |
| Day counts, tasks, % left | Pushed from JS when the app opens or returns to the foreground |

No continuous animation and no per-second timelines. Content goes stale at the end of the day (`staleDate`), and the Lock Screen shows "Open UNTIL to refresh".

## Buttons (iOS 17+)

Intents live in `ios/UNTIL/UNTILLiveActivityAttributes.swift` so both targets compile them (a `LiveActivityIntent` runs in the app process).

- `SwitchIslandModeIntent(mode:)`: the icon chips. Month and Life are Premium; `ContentState.isPremium` decides, so free users get a lock that opens the paywall.
- `ToggleIslandTimerIntent`: start or stop the hour timer. It writes the same App Group JSON as the home screen widget.

Both work while the app is closed. On the next foreground, `refreshLiveActivity()` (`WidgetSync.ts`) copies the chosen view and the timer state back into the app before it pushes new numbers, so the app never overwrites what the user did on the island.

## Deep links

Taps open the matching screen through `until://open/<Screen>` (`src/services/deepLinks.ts`, allow-listed): DayDetail, MonthDetail, YearDetail, Life, DailyTasks, HourCalculation, Badges, Premium.

## Testing on the simulator

- Build with `CODE_SIGN_IDENTITY="-" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=YES`. With `CODE_SIGNING_ALLOWED=NO` Xcode drops the entitlements, MMKV cannot open the App Group and the app crashes at launch. Hand-signing with `codesign` keeps the app alive but the widget extension cannot see the App Group data.
- The first Lock Screen activity shows an iOS "Allow Live Activities?" prompt.
- Long-press the island to expand it; use the HOME button first, the island hides while the app is frontmost.
