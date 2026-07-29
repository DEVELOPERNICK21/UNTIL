# Apple Watch Time Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-07-29-apple-watch-time-hub-design.md`

**Goal:** Ship Wear OS Time Hub parity on Apple Watch: swipeable Day / Month / Year / Life, Day-only circular complication, profile sync via WatchConnectivity, and Watch Xcode targets wired into the UNTIL project.

**Architecture:** Watch-local `WatchTimeClock` / `WatchLifeClock` compute Day–Year–Life (Life needs synced profile). Phone extends widget-cache → `WatchConnectivityBridge` application context with optional `birthDate` / `deathAge`. SwiftUI `TimeHubView` (page `TabView`) replaces single-page Day detail. Complication keeps `DayWatchCache` with local Day fallback.

**Tech Stack:** watchOS 10+, SwiftUI, WatchConnectivity, WidgetKit complications, React Native `WidgetCache` / MMKV TimeRepository, existing phone App Group + watch App Group

## Global Constraints

- All four hub pages free (no Premium check on watch)
- Complication / tile surface: Day % only
- Day / Month / Year: watch calendar math (offline); do not treat phone-pushed month/year/life % as hub SSOT
- Life: needs `birthDate` + `deathAge` from phone; empty copy exactly `Open UNTIL on phone`
- Labels: `TODAY` · `THIS MONTH` · `THIS YEAR` · `LIFE`
- Colors: keep `DayWatchDesign` (`#0E0E10`, `#E9A23A`, `#AA2222`, `#22AA22`, `#9A9A9A`, `#EDEDED`)
- Math parity with `src/core/time` (`getMonthProgress`, `getYearProgress`, `getLifeProgress`; default death age 80)
- Human-copy rules for visible strings (no em dashes, no coach / whisper filler like Wear’s `whisperFor`)
- Watch App Group: `group.com.develoeprnick.UNTIL.watch`
- Bundle ID: `com.develoeprnick.UNTIL.watchkitapp`
- Do not hand-edit `.pbxproj` to add source files once targets use folder sync; target creation itself is a manual Xcode step in Task 7
- No Ruby / `xcodeproj` gem

## File map

| File | Responsibility |
|------|----------------|
| `ios/UNTILWatchShared/PeriodSnapshot.swift` | Shared period DTO for hub pages |
| `ios/UNTILWatchShared/WatchTimeClock.swift` | Day / month / year from watch calendar |
| `ios/UNTILWatchShared/WatchLifeClock.swift` | Life snapshot from profile |
| `ios/UNTILWatchShared/WatchProfileStore.swift` | Persist `birthDate` / `deathAge` in watch App Group |
| `ios/WatchMath/Package.swift` + tests | SPM package wrapping shared math for `swift test` before Watch targets exist |
| `src/types/index.ts` | Optional `birthDate` / `deathAge` on `WidgetCache` |
| `src/infrastructure/repositories/MmkvTimeRepository.ts` | Include profile fields in `computeWidgetCache` |
| `ios/UNTILWidgets/UNTILWidgets.swift` | Decode optional profile fields on phone `WidgetCache` |
| `ios/UNTIL/WatchConnectivityBridge.swift` | Push profile fields in WCSession context |
| `ios/UNTILWatch/WatchSessionReceiver` (in app file) | Apply day cache + profile; optional refresh request |
| `ios/UNTILWatch/TimePeriodPageView.swift` | Shared hub page chrome |
| `ios/UNTILWatch/TimeHubView.swift` | Page TabView root |
| `ios/UNTILWatch/UNTILWatchApp.swift` | Root → `TimeHubView` |
| `ios/UNTILWatch/DayDetailView.swift` | Remove or thin to unused (prefer delete after hub ships) |
| `ios/UNTILWatchWidgets/UNTILWatchWidgets.swift` | Day complication + local Day fallback |
| `docs/APPLE_WATCH.md` | Time Hub + target status |

---

### Task 1: `PeriodSnapshot` + `WatchTimeClock` (TDD via SwiftPM)

**Files:**
- Create: `ios/UNTILWatchShared/PeriodSnapshot.swift`
- Create: `ios/UNTILWatchShared/WatchTimeClock.swift`
- Create: `ios/WatchMath/Package.swift`
- Create: `ios/WatchMath/Tests/WatchMathTests/WatchTimeClockTests.swift`

**Interfaces:**
- Consumes: Foundation `Calendar` / `Date`
- Produces:
  - `struct PeriodSnapshot: Equatable` with `progress: Double`, `percentDone: Int`, `percentLeft: Int`, `remainingLabel: String`, `passedLabel: String`, `updatedAt: TimeInterval` (ms), `progressClamped: Double`
  - `enum WatchTimeClock` with `static func day(now: Date = Date()) -> PeriodSnapshot`, `month(now:)`, `year(now:)`
  - Day: local midnight→next midnight; left label `Xh Ym left` (no seconds; matches current watch Day detail brevity)
  - Month: `(dayOfMonth - 1) / daysInMonth`; left `N days left`; passed `Day D of M`
  - Year: `dayOfYear / daysInYear`; left `N days left`; passed `Day D of Y`

- [ ] **Step 1: Create SwiftPM wrapper that compiles shared sources**

`ios/WatchMath/Package.swift`:

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
  name: "WatchMath",
  platforms: [.macOS(.v13)],
  products: [
    .library(name: "WatchMath", targets: ["WatchMath"]),
  ],
  targets: [
    .target(
      name: "WatchMath",
      path: "../UNTILWatchShared",
      exclude: ["Color+Hex.swift", "DayWatchCache.swift"],
      sources: nil
    ),
    .testTarget(
      name: "WatchMathTests",
      dependencies: ["WatchMath"],
      path: "Tests/WatchMathTests"
    ),
  ]
)
```

If `sources: nil` with exclude fails, list explicit source files: `PeriodSnapshot.swift`, `WatchTimeClock.swift` (add `WatchLifeClock.swift` / `WatchProfileStore.swift` in later tasks). Prefer listing sources explicitly:

```swift
.target(
  name: "WatchMath",
  path: "../UNTILWatchShared",
  sources: ["PeriodSnapshot.swift", "WatchTimeClock.swift"]
),
```

- [ ] **Step 2: Write the failing tests**

```swift
import XCTest
@testable import WatchMath

final class WatchTimeClockTests: XCTestCase {
  private func date(_ y: Int, _ m: Int, _ d: Int, _ h: Int, _ min: Int) -> Date {
    var c = Calendar(identifier: .gregorian)
    c.timeZone = .current
    return c.date(from: DateComponents(year: y, month: m, day: d, hour: h, minute: min))!
  }

  func testDayAtNoonNearFiftyPercent() {
    let snap = WatchTimeClock.day(now: date(2026, 7, 20, 12, 0))
    XCTAssertTrue((49...51).contains(snap.percentDone))
  }

  func testMonthOnFirstIsZero() {
    let snap = WatchTimeClock.month(now: date(2026, 7, 1, 8, 0))
    XCTAssertEqual(snap.percentDone, 0)
    XCTAssertTrue(snap.remainingLabel.contains("days left"))
  }

  func testYearOnJan1NearZero() {
    let snap = WatchTimeClock.year(now: date(2026, 1, 1, 1, 0))
    XCTAssertLessThanOrEqual(snap.percentDone, 1)
  }
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd ios/WatchMath && swift test`  
Expected: FAIL (missing types / compile error)

- [ ] **Step 4: Implement `PeriodSnapshot` + `WatchTimeClock`**

`ios/UNTILWatchShared/PeriodSnapshot.swift`:

```swift
import Foundation

struct PeriodSnapshot: Equatable {
  var progress: Double
  var percentDone: Int
  var percentLeft: Int
  var remainingLabel: String
  var passedLabel: String
  var updatedAt: TimeInterval

  var progressClamped: Double {
    min(1, max(0, progress))
  }
}
```

`ios/UNTILWatchShared/WatchTimeClock.swift` — mirror Wear `TimeClock` / phone core:

```swift
import Foundation

enum WatchTimeClock {
  static func day(now: Date = Date(), calendar: Calendar = .current) -> PeriodSnapshot {
    let start = calendar.startOfDay(for: now)
    guard let end = calendar.date(byAdding: .day, value: 1, to: start) else {
      return empty(now: now)
    }
    let total = max(1.0, end.timeIntervalSince(start))
    let elapsed = min(max(0, now.timeIntervalSince(start)), total)
    let progress = elapsed / total
    let percentDone = Int((progress * 100).rounded(.towardZero)).clamped(to: 0...100)
    let remainingSec = max(0, Int(end.timeIntervalSince(now)))
    let h = remainingSec / 3600
    let m = (remainingSec % 3600) / 60
    return PeriodSnapshot(
      progress: progress,
      percentDone: percentDone,
      percentLeft: (100 - percentDone).clamped(to: 0...100),
      remainingLabel: "\(h)h \(m)m left",
      passedLabel: "",
      updatedAt: now.timeIntervalSince1970 * 1000
    )
  }

  static func month(now: Date = Date(), calendar: Calendar = .current) -> PeriodSnapshot {
    let dayOfMonth = calendar.component(.day, from: now)
    let daysInMonth = calendar.range(of: .day, in: .month, for: now)?.count ?? 30
    let progress = Double(dayOfMonth - 1) / Double(daysInMonth)
    let percentDone = Int((progress * 100).rounded(.towardZero)).clamped(to: 0...100)
    let remainingDays = max(0, daysInMonth - dayOfMonth)
    return PeriodSnapshot(
      progress: progress,
      percentDone: percentDone,
      percentLeft: (100 - percentDone).clamped(to: 0...100),
      remainingLabel: "\(remainingDays) days left",
      passedLabel: "Day \(dayOfMonth) of \(daysInMonth)",
      updatedAt: now.timeIntervalSince1970 * 1000
    )
  }

  static func year(now: Date = Date(), calendar: Calendar = .current) -> PeriodSnapshot {
    let dayOfYear = calendar.ordinality(of: .day, in: .year, for: now) ?? 1
    let daysInYear = calendar.range(of: .day, in: .year, for: now)?.count ?? 365
    let progress = Double(dayOfYear) / Double(daysInYear)
    let percentDone = Int((progress * 100).rounded(.towardZero)).clamped(to: 0...100)
    let remainingDays = max(0, daysInYear - dayOfYear)
    return PeriodSnapshot(
      progress: progress,
      percentDone: percentDone,
      percentLeft: (100 - percentDone).clamped(to: 0...100),
      remainingLabel: "\(remainingDays) days left",
      passedLabel: "Day \(dayOfYear) of \(daysInYear)",
      updatedAt: now.timeIntervalSince1970 * 1000
    )
  }

  private static func empty(now: Date) -> PeriodSnapshot {
    PeriodSnapshot(
      progress: 0, percentDone: 0, percentLeft: 100,
      remainingLabel: "0h 0m left", passedLabel: "",
      updatedAt: now.timeIntervalSince1970 * 1000
    )
  }
}

private extension Int {
  func clamped(to range: ClosedRange<Int>) -> Int {
    min(range.upperBound, max(range.lowerBound, self))
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd ios/WatchMath && swift test`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add ios/UNTILWatchShared/PeriodSnapshot.swift ios/UNTILWatchShared/WatchTimeClock.swift ios/WatchMath
git commit -m "feat(watch): add WatchTimeClock day/month/year math"
```

---

### Task 2: `WatchLifeClock` + `WatchProfileStore` (TDD)

**Files:**
- Create: `ios/UNTILWatchShared/WatchProfileStore.swift`
- Create: `ios/UNTILWatchShared/WatchLifeClock.swift`
- Modify: `ios/WatchMath/Package.swift` (add sources to target)
- Create: `ios/WatchMath/Tests/WatchMathTests/WatchLifeClockTests.swift`

**Interfaces:**
- Consumes: `PeriodSnapshot`, App Group suite `DayWatchCache.suiteName`
- Produces:
  - `struct WatchProfile: Equatable { var birthDate: String; var deathAge: Int }`
  - `enum WatchProfileStore` with `load() -> WatchProfile?`, `save(birthDate:deathAge:)`, keys `until.watch.profile.birthDate` / `until.watch.profile.deathAge`
  - `enum WatchLifeClock` with `static func snapshot(profile: WatchProfile?, now: Date = Date()) -> PeriodSnapshot?`
  - Parse `YYYY-MM-DD`; invalid → `nil`; `deathAge <= 0` → 80
  - remainingLabel e.g. `42y left`; passedLabel e.g. `30y lived`

- [ ] **Step 1: Write the failing tests**

```swift
import XCTest
@testable import WatchMath

final class WatchLifeClockTests: XCTestCase {
  func testNilProfileReturnsNil() {
    XCTAssertNil(WatchLifeClock.snapshot(profile: nil))
  }

  func testInvalidBirthReturnsNil() {
    XCTAssertNil(WatchLifeClock.snapshot(profile: WatchProfile(birthDate: "bad", deathAge: 80)))
  }

  func testValidProfileProducesPercent() {
    let profile = WatchProfile(birthDate: "1990-01-01", deathAge: 80)
    let snap = WatchLifeClock.snapshot(
      profile: profile,
      now: Calendar.current.date(from: DateComponents(year: 2026, month: 7, day: 20))!
    )
    XCTAssertNotNil(snap)
    XCTAssertTrue((0...100).contains(snap!.percentDone))
    XCTAssertTrue(snap!.remainingLabel.contains("y left"))
  }

  func testNonPositiveDeathAgeFallsBackTo80() {
    let profile = WatchProfile(birthDate: "2000-01-01", deathAge: 0)
    let snap = WatchLifeClock.snapshot(profile: profile)
    XCTAssertNotNil(snap)
  }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ios/WatchMath && swift test`  
Expected: FAIL (missing types)

- [ ] **Step 3: Implement store + life clock**

`WatchProfileStore.swift`:

```swift
import Foundation

struct WatchProfile: Equatable {
  var birthDate: String
  var deathAge: Int
}

enum WatchProfileStore {
  static let birthKey = "until.watch.profile.birthDate"
  static let deathKey = "until.watch.profile.deathAge"
  static let defaultDeathAge = 80

  private static var defaults: UserDefaults {
    UserDefaults(suiteName: DayWatchCache.suiteName) ?? .standard
  }

  static func load() -> WatchProfile? {
    guard let birth = defaults.string(forKey: birthKey)?.trimmingCharacters(in: .whitespacesAndNewlines),
          !birth.isEmpty
    else { return nil }
    var death = defaults.integer(forKey: deathKey)
    if death <= 0 { death = defaultDeathAge }
    return WatchProfile(birthDate: birth, deathAge: death)
  }

  static func save(birthDate: String, deathAge: Int) {
    let trimmed = birthDate.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    let age = deathAge <= 0 ? defaultDeathAge : deathAge
    defaults.set(trimmed, forKey: birthKey)
    defaults.set(age, forKey: deathKey)
  }

  static func save(fromContext context: [String: Any]) {
    guard let birth = context["birthDate"] as? String else { return }
    let death: Int
    if let n = context["deathAge"] as? NSNumber {
      death = n.intValue
    } else if let i = context["deathAge"] as? Int {
      death = i
    } else {
      death = defaultDeathAge
    }
    save(birthDate: birth, deathAge: death)
  }
}
```

`WatchLifeClock.swift` — match Wear `LifeClock` / `getLifeProgress` (MS_PER_YEAR = 365.25 days):

```swift
import Foundation

enum WatchLifeClock {
  private static let msPerYear = 365.25 * 24 * 60 * 60 * 1000
  private static let defaultDeathAge = 80

  static func snapshot(profile: WatchProfile?, now: Date = Date()) -> PeriodSnapshot? {
    guard let profile else { return nil }
    guard let birth = parseBirthDate(profile.birthDate) else { return nil }
    let deathAge = profile.deathAge <= 0 ? defaultDeathAge : profile.deathAge
    var death = Calendar.current.dateComponents([.year, .month, .day], from: birth)
    death.year = (death.year ?? 0) + deathAge
    guard let deathDate = Calendar.current.date(from: death) else { return nil }

    let startMs = birth.timeIntervalSince1970 * 1000
    let endMs = deathDate.timeIntervalSince1970 * 1000
    let nowMs = now.timeIntervalSince1970 * 1000
    let totalMs = max(1.0, endMs - startMs)
    let elapsedMs = nowMs - startMs
    let progress: Double
    if elapsedMs <= 0 { progress = 0 }
    else if elapsedMs >= totalMs { progress = 1 }
    else { progress = min(1, max(0, elapsedMs / totalMs)) }

    let percentDone = Int((progress * 100).rounded(.towardZero)).clamped(to: 0...100)
    let yearsLived = max(0, elapsedMs / msPerYear)
    let yearsLeft = max(0, (endMs - nowMs) / msPerYear)

    return PeriodSnapshot(
      progress: progress,
      percentDone: percentDone,
      percentLeft: (100 - percentDone).clamped(to: 0...100),
      remainingLabel: "\(Int(yearsLeft))y left",
      passedLabel: "\(Int(yearsLived))y lived",
      updatedAt: nowMs
    )
  }

  private static func parseBirthDate(_ iso: String) -> Date? {
    let trimmed = iso.trimmingCharacters(in: .whitespacesAndNewlines)
    guard trimmed.count >= 10 else { return nil }
    let parts = trimmed.split(separator: "-")
    guard parts.count == 3,
          let y = Int(parts[0]), let m = Int(parts[1]), let d = Int(parts[2]),
          m >= 1, m <= 12, d >= 1, d <= 31
    else { return nil }
    return Calendar.current.date(from: DateComponents(year: y, month: m, day: d))
  }
}

private extension Int {
  func clamped(to range: ClosedRange<Int>) -> Int {
    min(range.upperBound, max(range.lowerBound, self))
  }
}
```

Update Package.swift `sources` to include `WatchLifeClock.swift` and `WatchProfileStore.swift`. `WatchProfileStore` references `DayWatchCache.suiteName` — either add `DayWatchCache.swift` to the SPM target **or** hardcode suite string `"group.com.develoeprnick.UNTIL.watch"` in the store for SPM and keep using `DayWatchCache.suiteName` in the watch app build. Prefer hardcoding the same string constant already on `DayWatchCache` to avoid pulling WidgetKit-free `DayWatchCache` into SPM (it is Foundation-only today — including `DayWatchCache.swift` in SPM sources is fine).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ios/WatchMath && swift test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ios/UNTILWatchShared/WatchLifeClock.swift ios/UNTILWatchShared/WatchProfileStore.swift ios/WatchMath
git commit -m "feat(watch): add WatchLifeClock and WatchProfileStore"
```

---

### Task 3: Phone `WidgetCache` + `WatchConnectivityBridge` profile push

**Files:**
- Modify: `src/types/index.ts` (`WidgetCache`)
- Modify: `src/infrastructure/repositories/MmkvTimeRepository.ts` (`computeWidgetCache`)
- Modify: `ios/UNTIL/WatchConnectivityBridge.swift`
- Modify: `ios/UNTILWidgets/UNTILWidgets.swift` (`WidgetCache` Codable — optional fields)
- Test: add assertions in an existing widget-cache test if present; otherwise add `__tests__/widgetCacheProfileFields.test.ts`

**Interfaces:**
- Consumes: `STORAGE_KEYS.USER_BIRTH_DATE`, `USER_DEATH_AGE`
- Produces: `WidgetCache.birthDate?: string`, `WidgetCache.deathAge?: number` when birth is set; bridge copies into WCSession context keys `birthDate`, `deathAge`

- [ ] **Step 1: Write the failing JS test**

```ts
import { STORAGE_KEYS } from '../src/persistence/schema';
// Use the same MMKV test helpers the repo already uses for time repository tests.
// If none exist, create a focused test that mocks persistence getters, or test
// compute path via repository after setting profile.

describe('widget cache profile fields', () => {
  it('includes birthDate and deathAge when profile is set', () => {
    // Arrange: set USER_BIRTH_DATE / USER_DEATH_AGE via existing test MMKV helpers
    // Act: timeRepository.getWidgetCache()
    // Assert:
    //   expect(cache.birthDate).toBe('1990-01-01')
    //   expect(cache.deathAge).toBe(80)
  });

  it('omits birthDate when unset', () => {
    // Assert cache.birthDate is undefined / null
  });
});
```

Discover existing MMKV test patterns with:

Run: `rg -n "getWidgetCache|USER_BIRTH_DATE|MmkvTimeRepository" __tests__ src --glob '*.test.*'`

Adapt the test to match repo helpers (do not invent a second storage stack).

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test __tests__/widgetCacheProfileFields.test.ts` (or the path you created)  
Expected: FAIL (fields missing)

- [ ] **Step 3: Extend types + `computeWidgetCache`**

In `src/types/index.ts` inside `WidgetCache`:

```ts
  /** ISO birth date for watch Life sync. Present only when set. */
  birthDate?: string;
  /** Expected lifespan years for watch Life sync. Present only when birthDate set. */
  deathAge?: number;
```

In `computeWidgetCache` return, after life fields:

```ts
    ...(profile.birthDate
      ? { birthDate: profile.birthDate, deathAge: profile.deathAge }
      : {}),
```

- [ ] **Step 4: Update phone Swift `WidgetCache` Codable**

In `ios/UNTILWidgets/UNTILWidgets.swift`, add optional:

```swift
let birthDate: String?
let deathAge: Int?
```

Decode with `decodeIfPresent`. Include in memberwise `init` with defaults `nil`. Unknown older caches must still decode.

- [ ] **Step 5: Extend `WatchConnectivityBridge.pushDayFromWidgetCacheJSON`**

After existing day field extraction, before `guard context["dayProgress"]`:

```swift
    if let birth = obj["birthDate"] as? String {
      let trimmed = birth.trimmingCharacters(in: .whitespacesAndNewlines)
      if !trimmed.isEmpty {
        context["birthDate"] = trimmed
        if let death = number(from: obj["deathAge"]) {
          context["deathAge"] = death.intValue > 0 ? death.intValue : 80
        } else {
          context["deathAge"] = 80
        }
      }
    }
```

Keep the existing day-field `guard` (still require day progress/percent to push). Profile-only pushes are not required in v1; profile rides with Day sync.

- [ ] **Step 6: Run JS test to verify pass**

Run: `yarn test __tests__/widgetCacheProfileFields.test.ts`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/infrastructure/repositories/MmkvTimeRepository.ts ios/UNTIL/WatchConnectivityBridge.swift ios/UNTILWidgets/UNTILWidgets.swift __tests__/widgetCacheProfileFields.test.ts
git commit -m "feat(watch): sync birthDate and deathAge via WatchConnectivity"
```

---

### Task 4: Watch session receiver applies profile + optional refresh ping

**Files:**
- Modify: `ios/UNTILWatch/UNTILWatchApp.swift` (`WatchSessionReceiver`)
- Modify: `ios/UNTIL/WatchConnectivityBridge.swift` (handle `WCSession` message `until.watch.refresh` if implementing ping)

**Interfaces:**
- Consumes: `WatchDayStore`, `WatchProfileStore`, `DayWatchCache.from`
- Produces: `@Published var cache: DayWatchCache?`, `@Published var profile: WatchProfile?` on `WatchSessionReceiver`
- On context: always try `WatchProfileStore.save(fromContext:)`; update `@Published profile = WatchProfileStore.load()`; keep existing day cache apply
- On activate (watch): if `WCSession.isReachable`, `sendMessage(["type": "until.watch.refresh"], ...)`
- On phone: implement `session(_:didReceiveMessage:replyHandler:)` → `pushCachedIfAvailable()` (which now includes profile via widget JSON)

- [ ] **Step 1: Extend receiver published state**

```swift
  @Published var cache: DayWatchCache?
  @Published var profile: WatchProfile?

  private override init() {
    super.init()
    cache = WatchDayStore.load()
    profile = WatchProfileStore.load()
    activate()
  }

  private func apply(_ context: [String: Any]) {
    WatchProfileStore.save(fromContext: context)
    let loadedProfile = WatchProfileStore.load()
    if let saved = WatchDayStore.save(fromContext: context) {
      DispatchQueue.main.async {
        self.cache = saved
        self.profile = loadedProfile
      }
      WidgetCenter.shared.reloadAllTimelines()
    } else {
      DispatchQueue.main.async {
        self.profile = loadedProfile
      }
    }
  }
```

If day fields are absent but profile is present, still update profile (adjust `save(fromContext:)` already no-ops without birthDate). When day save fails but profile updated, still `reloadAllTimelines` only if day cache changed.

- [ ] **Step 2: Watch → phone refresh ping**

In watch `activationDidCompleteWith` after apply:

```swift
    if activationState == .activated, session.isReachable {
      session.sendMessage(["type": "until.watch.refresh"], replyHandler: { _ in }, errorHandler: { _ in })
    }
```

- [ ] **Step 3: Phone reply path**

In `WatchConnectivityBridge`:

```swift
  func session(
    _ session: WCSession,
    didReceiveMessage message: [String: Any],
    replyHandler: @escaping ([String: Any]) -> Void
  ) {
    if (message["type"] as? String) == "until.watch.refresh" {
      pushCachedIfAvailable()
    }
    replyHandler(["ok": true])
  }
```

- [ ] **Step 4: Manual check (no XCTest target yet)**

Document in commit message / notes: after Task 7, verify activate watch app → phone logs / Life populates when birth date set.

- [ ] **Step 5: Commit**

```bash
git add ios/UNTILWatch/UNTILWatchApp.swift ios/UNTIL/WatchConnectivityBridge.swift
git commit -m "feat(watch): apply profile context and request refresh from phone"
```

---

### Task 5: `TimePeriodPageView` + `TimeHubView` UI

**Files:**
- Create: `ios/UNTILWatch/TimePeriodPageView.swift`
- Create: `ios/UNTILWatch/TimeHubView.swift`
- Modify: `ios/UNTILWatch/UNTILWatchApp.swift` (root view)
- Delete: `ios/UNTILWatch/DayDetailView.swift` after hub works (or leave unused until Task 7 clean-up)

**Interfaces:**
- Consumes: `PeriodSnapshot`, `WatchTimeClock`, `WatchLifeClock`, `WatchSessionReceiver.profile`
- Produces: swipeable 4-page hub; default page Day; empty Life shows `Open UNTIL on phone`
- Timer: refresh snapshots every 1s while view visible (`Timer.publish` or `TimelineView`)

- [ ] **Step 1: Shared page chrome**

```swift
import SwiftUI

struct TimePeriodPageView: View {
  let title: String
  let snapshot: PeriodSnapshot?
  let emptyText: String?
  let footer: String?

  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  @ScaledMetric(relativeTo: .largeTitle) private var percentFontSize: CGFloat = 40
  @ScaledMetric(relativeTo: .body) private var barHeight: CGFloat = 8

  private var isAccessibilitySize: Bool { dynamicTypeSize.isAccessibilitySize }

  var body: some View {
    ScrollView {
      if let snapshot {
        VStack(spacing: isAccessibilitySize ? 14 : 10) {
          Text(title)
            .font(.caption.weight(.medium))
            .foregroundColor(Color(hex: DayWatchDesign.label))
            .tracking(1)
            .frame(maxWidth: .infinity)

          Text("\(snapshot.percentDone)%")
            .font(.system(size: percentFontSize, weight: .bold))
            .foregroundColor(Color(hex: DayWatchDesign.percent))
            .minimumScaleFactor(0.5)
            .lineLimit(1)
            .frame(maxWidth: .infinity)

          GeometryReader { geo in
            ZStack(alignment: .leading) {
              Capsule().fill(Color(hex: DayWatchDesign.passed))
              Capsule()
                .fill(Color(hex: DayWatchDesign.left))
                .frame(width: max(0, geo.size.width * snapshot.progressClamped))
            }
          }
          .frame(height: barHeight)
          .padding(.horizontal, 4)
          .accessibilityHidden(true)

          Text(snapshot.remainingLabel)
            .font(.body.weight(.semibold))
            .foregroundColor(Color(hex: DayWatchDesign.text))
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)

          if let footer, !footer.isEmpty {
            Text(footer)
              .font(.caption2)
              .foregroundColor(Color(hex: DayWatchDesign.label))
              .multilineTextAlignment(.center)
              .frame(maxWidth: .infinity)
              .padding(.top, 4)
          }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
      } else if let emptyText {
        Text(emptyText)
          .font(.body.weight(.medium))
          .foregroundColor(Color(hex: DayWatchDesign.label))
          .multilineTextAlignment(.center)
          .padding(16)
          .frame(maxWidth: .infinity)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color(hex: DayWatchDesign.background).ignoresSafeArea())
  }
}
```

- [ ] **Step 2: Hub container**

```swift
import SwiftUI

struct TimeHubView: View {
  @EnvironmentObject private var session: WatchSessionReceiver
  @State private var tick = Date()

  private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

  var body: some View {
    TabView {
      TimePeriodPageView(
        title: "TODAY",
        snapshot: WatchTimeClock.day(now: tick),
        emptyText: nil,
        footer: nil
      )
      TimePeriodPageView(
        title: "THIS MONTH",
        snapshot: WatchTimeClock.month(now: tick),
        emptyText: nil,
        footer: nil
      )
      TimePeriodPageView(
        title: "THIS YEAR",
        snapshot: WatchTimeClock.year(now: tick),
        emptyText: nil,
        footer: nil
      )
      TimePeriodPageView(
        title: "LIFE",
        snapshot: WatchLifeClock.snapshot(profile: session.profile, now: tick),
        emptyText: "Open UNTIL on phone",
        footer: nil
      )
    }
    .tabViewStyle(.page)
    .onReceive(timer) { tick = $0 }
  }
}
```

- [ ] **Step 3: Point app root at hub**

In `UNTILWatchApp`:

```swift
      TimeHubView()
        .environmentObject(session)
```

- [ ] **Step 4: Remove `DayDetailView.swift`** once nothing references it

- [ ] **Step 5: Commit**

```bash
git add ios/UNTILWatch/TimePeriodPageView.swift ios/UNTILWatch/TimeHubView.swift ios/UNTILWatch/UNTILWatchApp.swift
git rm ios/UNTILWatch/DayDetailView.swift
git commit -m "feat(watch): add Time Hub swipe pages for Day Month Year Life"
```

---

### Task 6: Complication Day fallback to `WatchTimeClock.day`

**Files:**
- Modify: `ios/UNTILWatchWidgets/UNTILWatchWidgets.swift`
- Modify: `ios/UNTILWatchShared/DayWatchCache.swift` (helper to build cache from `PeriodSnapshot` if useful)

**Interfaces:**
- Consumes: `WatchDayStore.load()`, `WatchTimeClock.day()`
- Produces: timeline entry never blank solely because phone never synced — use local day snapshot → `DayWatchCache`

- [ ] **Step 1: Add converter**

In `DayWatchCache.swift` (or widget file):

```swift
  static func fromLocalDay(_ snap: PeriodSnapshot, now: Date = Date()) -> DayWatchCache {
    DayWatchCache(
      dayProgress: snap.progress,
      dayPercentDone: snap.percentDone,
      dayPercentLeft: snap.percentLeft,
      startOfDay: nil,
      endOfDay: nil,
      dayHoursLeft: nil,
      dayRemainingMinutes: nil,
      updatedAt: snap.updatedAt
    )
  }
```

- [ ] **Step 2: Update provider**

```swift
  private func resolvedCache() -> DayWatchCache {
    WatchDayStore.load() ?? DayWatchCache.fromLocalDay(WatchTimeClock.day())
  }
```

Use `resolvedCache()` in `getSnapshot` / `getTimeline`. Keep `widgetURL` `untilwatch://day`.

- [ ] **Step 3: Commit**

```bash
git add ios/UNTILWatchWidgets/UNTILWatchWidgets.swift ios/UNTILWatchShared/DayWatchCache.swift
git commit -m "feat(watch): fall back Day complication to local watch clock"
```

---

### Task 7: Xcode Watch App + Widget Extension targets

**Files:**
- Modify via Xcode UI: `ios/UNTIL.xcodeproj/project.pbxproj` (targets, embed, signing)
- Verify: `ios/UNTILWatch/*.entitlements`, `ios/UNTILWatchWidgets/*.entitlements` App Group

**Interfaces:**
- Produces: native targets `UNTILWatch`, `UNTILWatchWidgets` listed by `xcodebuild -list`
- Embed Watch app in UNTIL; embed widgets in Watch app

- [ ] **Step 1: Create Watch App target in Xcode**

Open `ios/UNTIL.xcworkspace` → File → New → Target → watchOS → App  
- Product Name: `UNTILWatch`  
- Bundle ID: `com.develoeprnick.UNTIL.watchkitapp`  
- Embed in: **UNTIL**  
- Interface: SwiftUI  

Delete Xcode sample sources. Ensure target membership includes:

- `UNTILWatch/UNTILWatchApp.swift`
- `UNTILWatch/TimeHubView.swift`
- `UNTILWatch/TimePeriodPageView.swift`
- `UNTILWatchShared/*.swift` (all shared math + cache + Color+Hex)
- Info.plist / entitlements paths from `docs/APPLE_WATCH.md`

- [ ] **Step 2: Create Widget Extension target**

File → New → Target → Widget Extension  
- Name: `UNTILWatchWidgets`  
- Embed in: **UNTILWatch**  
- Include Configuration Intent: **No**  

Replace generated sources with `UNTILWatchWidgets.swift` + shared files membership.

- [ ] **Step 3: Capabilities**

Both Watch targets: App Groups → `group.com.develoeprnick.UNTIL.watch`  
Developer portal: enable App Group on Watch App ID if needed.

- [ ] **Step 4: Verify listing**

Run: `xcodebuild -workspace ios/UNTIL.xcworkspace -list`  
Expected: schemes/targets include `UNTILWatch` and `UNTILWatchWidgets`

- [ ] **Step 5: Build Watch + iPhone pair**

Run (adjust sim names to what `xcrun simctl list` shows):

```bash
xcodebuild -workspace ios/UNTIL.xcworkspace -scheme UNTIL -destination 'platform=iOS Simulator,name=iPhone 16' build
```

Also build the Watch scheme if separate. Expected: BUILD SUCCEEDED

- [ ] **Step 6: Commit pbxproj + any scheme/shared data Xcode wrote**

```bash
git add ios/UNTIL.xcodeproj ios/UNTIL.xcworkspace
git commit -m "build(ios): add UNTILWatch and UNTILWatchWidgets Xcode targets"
```

Do **not** commit `xcuserdata` or `UserInterfaceState.xcuserstate`.

---

### Task 8: Docs + manual verification checklist

**Files:**
- Modify: `docs/APPLE_WATCH.md`
- Optionally cross-link in `docs/WEAR_OS.md` / `docs/WIDGETS.md`
- Website FAQ “coming soon” stays out of scope per spec (follow-up)

- [ ] **Step 1: Rewrite `docs/APPLE_WATCH.md` summary**

Reflect Time Hub (not Day-only app), profile sync keys, target status **done** after Task 7, test plan from spec.

- [ ] **Step 2: Device / simulator checklist**

1. Run UNTIL on paired iPhone; open app so widgets sync  
2. Watch hub: swipe Day → Month → Year → Life  
3. Clear watch profile / fresh install: Life shows `Open UNTIL on phone`; Day–Year live  
4. Set birth date on phone → Life populates  
5. Airplane mode: Day–Year tick; Life keeps last profile  
6. Add circular Day complication; tap → hub Day  
7. Accessibility largest text: no clipping  

- [ ] **Step 3: Commit docs**

```bash
git add docs/APPLE_WATCH.md docs/WEAR_OS.md docs/WIDGETS.md
git commit -m "docs: update Apple Watch Time Hub setup and parity notes"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Time Hub Day/Month/Year/Life | 5 |
| Labels + empty Life copy | 5 |
| Day-only complication + open Day | 6 (URL already `untilwatch://day`) |
| Watch-local Day/Month/Year math | 1 |
| Life math + profile store | 2 |
| WCSession `birthDate` / `deathAge` | 3–4 |
| Optional watch refresh ping | 4 |
| Free / no Premium | 5 (no gate) |
| Xcode targets ship gate | 7 |
| Docs update | 8 |
| Website FAQ | Out of scope (documented) |
| No whisper / coach filler | 5 (plain labels only) |
| Dynamic Type / scroll | 5 (`TimePeriodPageView`) |
| Complication local fallback | 6 |

No TBD placeholders remain. Types `PeriodSnapshot`, `WatchProfile`, `WatchTimeClock`, `WatchLifeClock`, `WatchProfileStore` are consistent across tasks.
