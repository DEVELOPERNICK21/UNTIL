# Apple Watch Day % — Design Spec

**Date:** 2026-07-14  
**Status:** Approved for v1 implementation  
**Platform:** Apple Watch only (Wear OS later)

## Decisions

| Decision | Choice |
|----------|--------|
| MVP surfaces | Day % only |
| Complication style | Circular gauge |
| Tap behavior | Open watch Day detail screen |
| Architecture | Watch App + Watch WidgetKit complication |
| Data | One-way phone → watch via WatchConnectivity |

## Architecture

```
RN App → SyncWidgetUseCase → WidgetCache
                ↓
         WidgetBridge.setWidgetCache (App Group + phone widgets)
                ↓
         WatchConnectivityBridge.pushDayFromWidgetCacheJSON
                ↓  WCSession.updateApplicationContext
         WatchDayStore (Watch UserDefaults)
           ├─ UNTILWatchWidgets (circular complication)
           └─ UNTILWatch (Day detail on tap)
```

Phone App Groups do **not** sync to the Watch automatically. WatchConnectivity is required.

## UI

### Circular complication
- Ring: red passed / green left (Design tokens `#AA2222` / `#22AA22`)
- Center: `DAY` + `dayPercentDone%` (orange `#E87C20` / `#E9A23A`)
- Empty: “Open UNTIL”

### Watch Day detail
- Large `% done`
- Progress bar
- Time left string (e.g. `9h 12m left`)
- Footer: `Synced from iPhone`
- Empty: `Open UNTIL on iPhone to sync`

### Gating
Day is free forever — no Premium check on watch.

## Sync rules

- Trigger: whenever phone writes `widget.cache` (via existing `WidgetBridge.setWidgetCache`)
- API: `WCSession.default.updateApplicationContext`
- Payload keys: `dayProgress`, `dayPercentDone`, `dayPercentLeft`, `updatedAt`
- Complication timeline: reload on context receive; policy refresh ~15–30 minutes
- Unpaired / inactive session: silent no-op on phone
- v1: no Watch → Phone writes

## Components

| Path | Role |
|------|------|
| `ios/UNTIL/WatchConnectivityBridge.swift` | Phone WCSession delegate + push |
| `ios/UNTILWatchShared/DayWatchCache.swift` | Shared model + formatting |
| `ios/UNTILWatch/` | watchOS app (Day detail) |
| `ios/UNTILWatchWidgets/` | Circular Day complication |
| `docs/APPLE_WATCH.md` | Xcode target setup steps |

## Out of scope (v1)

Countdown/Life on watch, watch settings, bidirectional sync, standalone watch without phone.

## Wear OS parity

Same Day % MVP on Android watches — [`docs/WEAR_OS.md`](../../WEAR_OS.md), module `android/wear`, Data Layer path `/until/day`.

## Testing

1. Pair Apple Watch simulator / device with iPhone running UNTIL  
2. Open UNTIL → Day syncs → complication shows %  
3. Tap complication → Day detail  
4. Kill app / clear → empty state until next open  

## Success criteria

- Circular Day % appears in watch face complication picker  
- Matches phone `dayPercentDone` after sync  
- Tap opens watch detail with time left  
- No crash when Watch unpaired  
