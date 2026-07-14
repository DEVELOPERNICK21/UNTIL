# Apple Watch Day % (v1)

UNTIL ships a **circular Day % complication** and a **watch Day detail** screen. Phone → watch sync uses WatchConnectivity.

**Wear OS parity:** see [`docs/WEAR_OS.md`](./WEAR_OS.md) (same Day % MVP on Android watches via Data Layer).

Design: [`docs/superpowers/specs/2026-07-14-apple-watch-day-design.md`](./superpowers/specs/2026-07-14-apple-watch-day-design.md)

---

## What’s already in the repo

| Path | Role |
|------|------|
| `ios/UNTIL/WatchConnectivityBridge.swift` | Phone push after `WidgetBridge.setWidgetCache` |
| `ios/UNTIL/AppDelegate.swift` | Calls `WatchConnectivityBridge.start()` |
| `ios/UNTILWatchShared/` | `DayWatchCache` + `Color+Hex` |
| `ios/UNTILWatch/` | watchOS app (Day detail) |
| `ios/UNTILWatchWidgets/` | Circular complication |

**Phone-side wiring is done** (bridge + pbxproj). You still need to **create Watch targets in Xcode** once (Apple doesn’t auto-pick up new watchOS app targets from folders alone).

---

## One-time Xcode setup

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

1. Run UNTIL on the paired iPhone simulator/device.
2. Open the app so widgets/cache sync (pushes Day via WCSession).
3. On the Watch: add **UNTIL Day** complication (circular slot).
4. Confirm % matches the phone Day widget.
5. Tap the complication → Day detail should open on the watch.
6. Force-quit / reinstall Watch app → empty copy until the next phone sync.

---

## Sync payload

Keys in `WCSession` application context:

`dayProgress`, `dayPercentDone`, `dayPercentLeft`, `startOfDay`, `endOfDay`, `dayHoursLeft`, `dayRemainingMinutes`, `updatedAt`

---

## Next (not v1)

- Countdown complication  
- Life % (Premium gate)  
- Wear OS tiles  
