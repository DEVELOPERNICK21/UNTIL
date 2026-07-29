# Apple Watch Time Hub — Design Spec

**Date:** 2026-07-29  
**Status:** Approved  
**Platform:** watchOS (`ios/UNTILWatch`, `ios/UNTILWatchWidgets`, `ios/UNTILWatchShared`)  
**Parity with:** [`2026-07-20-wear-time-hub-design.md`](./2026-07-20-wear-time-hub-design.md) / [`docs/WEAR_OS.md`](../../WEAR_OS.md)  
**Builds on:** Day MVP in [`2026-07-14-apple-watch-day-design.md`](./2026-07-14-apple-watch-day-design.md) and [`docs/APPLE_WATCH.md`](../../APPLE_WATCH.md)

## Decisions

| Decision | Choice |
|----------|--------|
| Goal | Wear OS Time Hub parity on Apple Watch |
| Navigation | SwiftUI `TabView` + `.tabViewStyle(.page)` (swipe + page dots) |
| Complication | Day % only (circular); tap opens hub on Day |
| Day / Month / Year data | Computed on watch clock (offline) |
| Life data | Needs `birthDate` + `deathAge` synced from phone via WatchConnectivity |
| Gating | All four pages free (no Premium check) |
| Approach | Watch-local math + phone profile sync for Life |
| Ship gate | Create Watch App + Widget Extension Xcode targets (sources already in repo) |

## Product

| Page | Label | Primary content | Empty / missing data |
|------|-------|-----------------|----------------------|
| Day | `TODAY` | % done, progress bar, left line, footer | N/A (always computable) |
| Month | `THIS MONTH` | Same chrome as Day | N/A |
| Year | `THIS YEAR` | Same chrome as Day | N/A |
| Life | `LIFE` | Same chrome as Day | `Open UNTIL on phone` until profile synced |

- Default page on launch: **Day**
- Page dots indicate index (4)
- Circular complication remains **UNTIL Day** only

## Architecture

```
Phone UNTIL
  → WidgetBridge.setWidgetCache / widget.cache update
  → WatchConnectivityBridge
        applicationContext: day fields + birthDate + deathAge
        ↓  WCSession.updateApplicationContext
Apple Watch
  → WatchSessionReceiver
  → DayWatchCache (App Group) — complication Day %
  → ProfileStore (App Group) — birthDate, deathAge
  → TimeHubView (TabView page style)
       ├─ Day / Month / Year ← WatchTimeClock (watch calendar)
       └─ Life ← WatchLifeClock(ProfileStore) or empty
  → UNTILWatchWidgets — circular Day complication
```

### Components (watchOS)

| Path / type | Role |
|-------------|------|
| `TimeHubView` | Replaces single `DayDetailView` as root; hosts page TabView |
| `TimePeriodPageView` (or refactor of `DayDetailView`) | Shared chrome: label, %, bar, left, footer |
| `WatchTimeClock` | Pure Swift: day / month / year snapshots from watch calendar |
| `WatchLifeClock` | Life snapshot from birth + death age + now |
| `ProfileStore` | Persist `birthDate` (ISO `YYYY-MM-DD`), `deathAge` (int) in watch App Group |
| `DayWatchCache` | Keep for complication Day %; may share day math with `WatchTimeClock` |
| `WatchSessionReceiver` | Parse extended context; update day cache + profile; refresh UI |

### Phone

| Path | Role |
|------|------|
| `WatchConnectivityBridge.swift` | Add optional `birthDate`, `deathAge` to application context |
| Call sites (`WidgetBridge` / profile writes) | Include profile when pushing Day; on watch request reply with day + profile |

Do **not** push month/year/life percents as SSOT for the pager. Watch computes those (Life needs profile inputs only).

### App Group

Watch App Group stays `group.com.develoeprnick.UNTIL.watch` (`DayWatchCache.suiteName`). Phone App Group for widgets stays separate; profile reaches the watch only via WatchConnectivity.

## Math (parity with phone core)

Match `src/core/time` semantics:

| Period | Rule |
|--------|------|
| **Day** | Elapsed ms / (endOfDay − startOfDay); left e.g. `Xh Ym left` |
| **Month** | `(dayOfMonth - 1) / daysInMonth` (same as `getMonthProgress`); left e.g. `12 days left` |
| **Year** | `dayOfYear / daysInYear` (same as `getYearProgress`) |
| **Life** | Same as `getLifeProgress(birthDate, deathAge)`; default death age **80** if missing but birth present |

Colors stay `DayWatchDesign`: bg `#0E0E10`, percent `#E9A23A`, bar `#AA2222` / `#22AA22`, label `#9A9A9A`, text `#EDEDED`.

## Sync rules

- **Transport:** `WCSession.updateApplicationContext` (existing Day path)
- **New fields (optional):** `birthDate` (string ISO `YYYY-MM-DD`), `deathAge` (int)
- **When phone pushes:** existing widget/day sync; include profile from MMKV / TimeRepository when available
- **When watch requests (optional ping):** phone replies with day fields **and** profile fields
- **Unpaired / no profile:** Day/Month/Year still work; Life shows empty state
- **v1:** no watch → phone profile writes
- **Complication:** prefer `DayWatchCache` from phone push; if empty, fall back to `WatchTimeClock.day` so the slot is not blank offline after install

Existing Day context keys remain: `dayProgress`, `dayPercentDone`, `dayPercentLeft`, `startOfDay`, `endOfDay`, `dayHoursLeft`, `dayRemainingMinutes`, `updatedAt`.

## UI details

- One shared page layout reused 4× (label differs; Life empty copy: `Open UNTIL on phone`)
- Month/Year left: calendar remaining days; Day keeps hour/minute left
- Life left: short years/days remaining suitable for round screens
- Dynamic Type via `@ScaledMetric` / system fonts; content scrolls at large accessibility sizes
- Page style TabView provides dots; active indicator follows system watchOS chrome

## Error handling

| Case | Behavior |
|------|----------|
| No connected phone | Day/Month/Year live; Life empty if never synced |
| Corrupt / missing birthDate | Life empty state |
| Invalid deathAge | Fall back to 80 |
| Watch targets missing in Xcode | Documented one-time setup; implementation includes adding targets |

## Xcode setup (ship gate)

Sources exist under `ios/UNTILWatch/`, `ios/UNTILWatchWidgets/`, `ios/UNTILWatchShared/`. Phone bridge is wired. Native targets are **not** in `project.pbxproj` yet.

1. Add Watch App target `UNTILWatch`, bundle ID `com.develoeprnick.UNTIL.watchkitapp`, embed in UNTIL
2. Add Widget Extension `UNTILWatchWidgets`, embed in Watch app
3. Target membership for shared Swift files; entitlements + App Group
4. Deployment: watchOS 10+

## Out of scope

- Month/Year/Life complications
- Tasks, deadlines, Ember on watch
- Premium gating on watch
- Two-way profile edit on watch
- Rewriting Wear OS
- Website FAQ update (follow-up once TestFlight-ready; currently says Apple Watch “coming soon”)

## Testing

1. Watch + iPhone simulator/device: build UNTIL (Watch embeds)
2. Open hub → Day; swipe Month, Year, Life
3. Without profile: Life empty; Day/Month/Year show live %
4. Open phone UNTIL (birth date set) → sync → Life populates
5. Airplane / unpaired: Day/Month/Year still tick; Life keeps last profile if stored
6. Complication shows Day %; tap opens hub on Day
7. Accessibility → largest text size: no edge clipping; content scrolls

## Success criteria

- Four swipeable time pages on Apple Watch
- Day/Month/Year work offline from watch clock
- Life works after one successful phone sync with birth date
- Circular complication remains Day-only
- No Premium requirement on watch
- Watch targets present in Xcode project and build with UNTIL

## Docs to update after implementation

- [`docs/APPLE_WATCH.md`](../../APPLE_WATCH.md) — Time Hub + profile sync + target status
- Cross-link from [`docs/WEAR_OS.md`](../../WEAR_OS.md) / [`docs/WIDGETS.md`](../../WIDGETS.md) if needed
- Website FAQ soft “coming soon” line (optional follow-up when shipping)
