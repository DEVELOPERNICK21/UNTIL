# Watch Progress Ring Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-09-21-watch-progress-ring-design.md`

**Goal:** Replace the Time Hub linear progress bar with a thick circular ring, colorful green→amber→red fill, and glowing tip — hub pages only.

**Architecture:** Pure `WatchProgressColor` (Foundation) mirrors phone `getProgressColor` and is unit-tested via existing `WatchMath` SwiftPM. SwiftUI `WatchProgressRing` draws track + trim fill + tip glow. `TimePeriodPageView` centers `%` inside the ring; title above, remaining below. Complication unchanged.

**Tech Stack:** watchOS / SwiftUI, Foundation, XCTest via `ios/WatchMath`, existing `Color(hex:)` helper

## Global Constraints

- Hub-only: do not change circular complication / `UNTILWatchWidgets` chrome this pass
- Progress colors exactly: `#22C55E` (0) → `#F59E0B` (0.5) → `#EF4444` (1), RGB lerp, same piecewise rule as `src/theme/progressColor.ts`
- Background stays `#0E0E10`; track `~#2A2A2E`; tip glow soft (low opacity), no pulse animation
- Keep four pages, labels, Life empty copy `Open UNTIL on phone`, Dynamic Type scaling for text
- Ring is decorative (`accessibilityHidden`); VoiceOver still reads title + `%` + remaining
- Active Xcode target sources live in `ios/UNTILWatch Watch App/` (folder-synced). `ios/UNTILWatchShared/` is SSOT for WatchMath tests (symlinked). Mirror shared pure helpers into both places like existing clocks/cache
- Human-copy rules for any new user-visible strings (none expected)
- Do not hand-edit `.pbxproj` for new files under folder-synced groups
- No commit unless the user explicitly asks (skip plan “Commit” steps, or pause and ask)

## File map

| File | Responsibility |
|------|----------------|
| `ios/UNTILWatchShared/WatchProgressColor.swift` | Pure progress → hex (+ RGB components); SSOT for tests |
| `ios/WatchMath/Sources/WatchMath/WatchProgressColor.swift` | Symlink → Shared (same pattern as other WatchMath sources) |
| `ios/UNTILWatch Watch App/WatchProgressColor.swift` | Same source content as Shared (Watch App compile copy) |
| `ios/WatchMath/Tests/WatchMathTests/WatchProgressColorTests.swift` | Unit tests for color stops |
| `ios/UNTILWatch Watch App/WatchProgressRing.swift` | SwiftUI ring: track, fill, tip, glow |
| `ios/UNTILWatch Watch App/TimePeriodPageView.swift` | New layout: title → ring+`%` → remaining |
| `ios/UNTILWatchShared/DayWatchCache.swift` | Add `track` to `DayWatchDesign`; keep bg/label/text |
| `ios/UNTILWatch Watch App/DayWatchCache.swift` | Mirror `DayWatchDesign` token update |
| `ios/UNTILWatch/TimePeriodPageView.swift` | Optional stale mirror — update only if still kept in sync by convention; prefer Watch App as truth |

---

### Task 1: `WatchProgressColor` (TDD via WatchMath)

**Files:**
- Create: `ios/UNTILWatchShared/WatchProgressColor.swift`
- Create: `ios/WatchMath/Sources/WatchMath/WatchProgressColor.swift` (symlink)
- Create: `ios/UNTILWatch Watch App/WatchProgressColor.swift` (identical content)
- Create: `ios/WatchMath/Tests/WatchMathTests/WatchProgressColorTests.swift`

**Interfaces:**
- Consumes: Foundation only
- Produces:
  - `enum WatchProgressColor`
  - `static func hex(for progress: Double) -> String` — `#RRGGBB` uppercase hex
  - `static func rgb(for progress: Double) -> (r: Double, g: Double, b: Double)` — 0…1 components
  - Clamps progress to 0…1; at `p <= 0.5` lerp start→mid with `t = p * 2`; else mid→end with `t = (p - 0.5) * 2`
  - Constants: start `#22C55E`, mid `#F59E0B`, end `#EF4444`

- [ ] **Step 1: Write the failing tests**

`ios/WatchMath/Tests/WatchMathTests/WatchProgressColorTests.swift`:

```swift
import XCTest
@testable import WatchMath

final class WatchProgressColorTests: XCTestCase {
  func testStartIsGreen() {
    XCTAssertEqual(WatchProgressColor.hex(for: 0), "#22C55E")
  }

  func testMidIsAmber() {
    XCTAssertEqual(WatchProgressColor.hex(for: 0.5), "#F59E0B")
  }

  func testEndIsRed() {
    XCTAssertEqual(WatchProgressColor.hex(for: 1), "#EF4444")
  }

  func testClampsBelowZero() {
    XCTAssertEqual(WatchProgressColor.hex(for: -1), "#22C55E")
  }

  func testClampsAboveOne() {
    XCTAssertEqual(WatchProgressColor.hex(for: 2), "#EF4444")
  }

  func testQuarterIsBetweenGreenAndAmber() {
    let rgb = WatchProgressColor.rgb(for: 0.25)
    // Midway green→amber: R and G between start and mid
    XCTAssertGreaterThan(rgb.r, 0x22 / 255.0)
    XCTAssertLessThan(rgb.r, 0xF5 / 255.0)
    XCTAssertEqual(rgb.r, rgb.g, accuracy: 0.15) // still green-dominant-ish; soft check
  }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd ios/WatchMath && swift test --filter WatchProgressColorTests
```

Expected: FAIL (type `WatchProgressColor` not found / cannot find in scope)

- [ ] **Step 3: Implement `WatchProgressColor` in Shared**

`ios/UNTILWatchShared/WatchProgressColor.swift`:

```swift
import Foundation

enum WatchProgressColor {
  private static let start = (r: 0x22 / 255.0, g: 0xC5 / 255.0, b: 0x5E / 255.0)
  private static let mid = (r: 0xF5 / 255.0, g: 0x9E / 255.0, b: 0x0B / 255.0)
  private static let end = (r: 0xEF / 255.0, g: 0x44 / 255.0, b: 0x44 / 255.0)

  static func rgb(for progress: Double) -> (r: Double, g: Double, b: Double) {
    let p = min(1, max(0, progress))
    let from: (r: Double, g: Double, b: Double)
    let to: (r: Double, g: Double, b: Double)
    let t: Double
    if p <= 0.5 {
      from = start
      to = mid
      t = p * 2
    } else {
      from = mid
      to = end
      t = (p - 0.5) * 2
    }
    return (
      r: from.r + (to.r - from.r) * t,
      g: from.g + (to.g - from.g) * t,
      b: from.b + (to.b - from.b) * t
    )
  }

  static func hex(for progress: Double) -> String {
    let c = rgb(for: progress)
    func byte(_ x: Double) -> Int { Int((x * 255).rounded()) }
    return String(format: "#%02X%02X%02X", byte(c.r), byte(c.g), byte(c.b))
  }
}
```

- [ ] **Step 4: Symlink into WatchMath + copy into Watch App**

```bash
cd ios/WatchMath/Sources/WatchMath
ln -sf ../../../UNTILWatchShared/WatchProgressColor.swift WatchProgressColor.swift
cp ../../../UNTILWatchShared/WatchProgressColor.swift "../../../UNTILWatch Watch App/WatchProgressColor.swift"
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
cd ios/WatchMath && swift test --filter WatchProgressColorTests
```

Expected: PASS (all `WatchProgressColorTests`)

If `testQuarterIsBetweenGreenAndAmber` is flaky, replace the soft `rgb.r == rgb.g` assert with:

```swift
XCTAssertEqual(WatchProgressColor.hex(for: 0.25), "#8CB135") // exact lerp at t=0.5 on first segment
```

(Compute once from the implementation: midpoint of start/mid bytes.)

- [ ] **Step 6: Commit** (only if user asked)

```bash
git add ios/UNTILWatchShared/WatchProgressColor.swift \
  ios/WatchMath/Sources/WatchMath/WatchProgressColor.swift \
  "ios/UNTILWatch Watch App/WatchProgressColor.swift" \
  ios/WatchMath/Tests/WatchMathTests/WatchProgressColorTests.swift
git commit -m "$(cat <<'EOF'
Add WatchProgressColor matching phone green→amber→red scale.

EOF
)"
```

---

### Task 2: `DayWatchDesign` track token

**Files:**
- Modify: `ios/UNTILWatchShared/DayWatchCache.swift` (`DayWatchDesign` enum)
- Modify: `ios/UNTILWatch Watch App/DayWatchCache.swift` (same)

**Interfaces:**
- Consumes: none new
- Produces: `DayWatchDesign.track = "#2A2A2E"`; keep `background`, `label`, `text`; leave `passed` / `left` / `percent` in place for complication until a follow-up (hub will stop using them)

- [ ] **Step 1: Update Shared `DayWatchDesign`**

In `ios/UNTILWatchShared/DayWatchCache.swift`, change:

```swift
enum DayWatchDesign {
  static let background = "#0E0E10"
  static let passed = "#AA2222"
  static let left = "#22AA22"
  static let percent = "#E9A23A"
  static let label = "#9A9A9A"
  static let text = "#EDEDED"
}
```

to:

```swift
enum DayWatchDesign {
  static let background = "#0E0E10"
  static let track = "#2A2A2E"
  static let passed = "#AA2222"
  static let left = "#22AA22"
  static let percent = "#E9A23A"
  static let label = "#9A9A9A"
  static let text = "#EDEDED"
}
```

- [ ] **Step 2: Mirror into Watch App `DayWatchCache.swift`**

Apply the identical `track` addition in `ios/UNTILWatch Watch App/DayWatchCache.swift`.

- [ ] **Step 3: Sanity-check WatchMath still builds**

Run:

```bash
cd ios/WatchMath && swift test --filter WatchProgressColorTests
```

Expected: PASS (DayWatchCache still compiles; no test dependency on new token required)

- [ ] **Step 4: Commit** (only if user asked)

```bash
git add ios/UNTILWatchShared/DayWatchCache.swift "ios/UNTILWatch Watch App/DayWatchCache.swift"
git commit -m "$(cat <<'EOF'
Add watch ring track color token for Time Hub reskin.

EOF
)"
```

---

### Task 3: `WatchProgressRing` view

**Files:**
- Create: `ios/UNTILWatch Watch App/WatchProgressRing.swift`

**Interfaces:**
- Consumes: `WatchProgressColor.hex(for:)`, `DayWatchDesign.track`, `Color(hex:)`
- Produces: `struct WatchProgressRing: View` with `progress: Double`, optional `lineWidth: CGFloat = 11`

- [ ] **Step 1: Add ring view**

`ios/UNTILWatch Watch App/WatchProgressRing.swift`:

```swift
import SwiftUI

struct WatchProgressRing: View {
  let progress: Double
  var lineWidth: CGFloat = 11

  private var clamped: Double { min(1, max(0, progress)) }
  private var fill: Color { Color(hex: WatchProgressColor.hex(for: clamped)) }
  private var track: Color { Color(hex: DayWatchDesign.track) }

  var body: some View {
    GeometryReader { geo in
      let side = min(geo.size.width, geo.size.height)
      let tipSize = max(6, lineWidth * 0.95)
      ZStack {
        Circle()
          .stroke(track, lineWidth: lineWidth)

        Circle()
          .trim(from: 0, to: clamped)
          .stroke(fill, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
          .rotationEffect(.degrees(-90))

        // Soft glow behind tip
        Circle()
          .fill(fill.opacity(0.35))
          .frame(width: tipSize * 2.2, height: tipSize * 2.2)
          .offset(y: -(side / 2) + lineWidth / 2)
          .rotationEffect(.degrees(360 * clamped))

        // Tip
        Circle()
          .fill(fill)
          .frame(width: tipSize, height: tipSize)
          .offset(y: -(side / 2) + lineWidth / 2)
          .rotationEffect(.degrees(360 * clamped))
      }
      .frame(width: side, height: side)
      .position(x: geo.size.width / 2, y: geo.size.height / 2)
    }
    .aspectRatio(1, contentMode: .fit)
    .accessibilityHidden(true)
  }
}
```

Note: tip starts at 12 o’clock (`offset` up) then rotates by `360 * clamped`, matching fill that starts after `-90°` rotation. If tip looks one stroke-width off on device, nudge `offset(y:)` by `± lineWidth/4` — do not change color math.

- [ ] **Step 2: Build Watch App in Xcode**

Scheme: **UNTILWatch Watch App** (or **UNTIL** with embedded watch).  
Expected: compiles; ring not on screen yet.

- [ ] **Step 3: Commit** (only if user asked)

```bash
git add "ios/UNTILWatch Watch App/WatchProgressRing.swift"
git commit -m "$(cat <<'EOF'
Add WatchProgressRing with colorful fill and glowing tip.

EOF
)"
```

---

### Task 4: Wire ring into `TimePeriodPageView`

**Files:**
- Modify: `ios/UNTILWatch Watch App/TimePeriodPageView.swift`
- Optional mirror: `ios/UNTILWatch/TimePeriodPageView.swift` (legacy path; skip if unused by target)

**Interfaces:**
- Consumes: `WatchProgressRing(progress:)`, `PeriodSnapshot`, `DayWatchDesign`
- Produces: updated page chrome per spec layout

- [ ] **Step 1: Replace capsule bar with ring + centered `%`**

Replace the body content of `TimePeriodPageView` in `ios/UNTILWatch Watch App/TimePeriodPageView.swift` with:

```swift
import SwiftUI

struct TimePeriodPageView: View {
  let title: String
  let snapshot: PeriodSnapshot?
  let emptyText: String?
  let footer: String?

  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  @ScaledMetric(relativeTo: .largeTitle) private var percentFontSize: CGFloat = 40

  private var isAccessibilitySize: Bool {
    dynamicTypeSize.isAccessibilitySize
  }

  var body: some View {
    ScrollView {
      if let snapshot {
        VStack(spacing: isAccessibilitySize ? 12 : 8) {
          Text(title)
            .font(.caption.weight(.medium))
            .foregroundColor(Color(hex: DayWatchDesign.label))
            .tracking(1)
            .frame(maxWidth: .infinity)

          ZStack {
            WatchProgressRing(progress: snapshot.progressClamped)
              .padding(4)

            Text("\(snapshot.percentDone)%")
              .font(.system(size: percentFontSize, weight: .bold))
              .foregroundColor(Color(hex: DayWatchDesign.text))
              .minimumScaleFactor(0.5)
              .lineLimit(1)
          }
          .frame(maxWidth: .infinity)
          .aspectRatio(1, contentMode: .fit)
          .padding(.horizontal, isAccessibilitySize ? 8 : 16)

          Text(snapshot.remainingLabel)
            .font(.body.weight(.semibold))
            .foregroundColor(Color(hex: DayWatchDesign.text))
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity)

          if let footer, !footer.isEmpty {
            Text(footer)
              .font(.caption2)
              .foregroundColor(Color(hex: DayWatchDesign.label))
              .multilineTextAlignment(.center)
              .fixedSize(horizontal: false, vertical: true)
              .frame(maxWidth: .infinity)
              .padding(.top, 2)
          }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
      } else if let emptyText {
        Text(emptyText)
          .font(.body.weight(.medium))
          .foregroundColor(Color(hex: DayWatchDesign.label))
          .multilineTextAlignment(.center)
          .fixedSize(horizontal: false, vertical: true)
          .padding(16)
          .frame(maxWidth: .infinity)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color(hex: DayWatchDesign.background).ignoresSafeArea())
  }
}
```

Remove unused `@ScaledMetric` `barHeight` and the `GeometryReader` capsule block.

- [ ] **Step 2: Confirm `TimeHubView` needs no API changes**

`TimeHubView` already passes `title` / `snapshot` / `emptyText` / `footer` — no edits required unless compile errors appear.

- [ ] **Step 3: Manual verification on Watch simulator**

1. Run **UNTILWatch Watch App** on a Watch simulator  
2. Swipe Day / Month / Year / Life — ring visible, `%` inside, remaining below  
3. Mentally check color: morning Day ≈ green, late Day ≈ amber/red  
4. Life without profile: `Open UNTIL on phone`  
5. Settings → Accessibility → largest Text Size: `%` and remaining still readable / scrollable  

- [ ] **Step 4: Commit** (only if user asked)

```bash
git add "ios/UNTILWatch Watch App/TimePeriodPageView.swift"
git commit -m "$(cat <<'EOF'
Reskin Watch Time Hub pages with circular progress ring.

EOF
)"
```

---

### Task 5: Spec coverage check + short doc note

**Files:**
- Modify: `docs/APPLE_WATCH.md` (one short paragraph under what’s in the repo / Time Hub)

- [ ] **Step 1: Add hub UI note**

Near the “What’s already in the repo” / Time Hub mention, add:

```markdown
**Time Hub UI (2026-09-21):** Each Day / Month / Year / Life page shows a thick circular progress ring (green→amber→red) with a glowing tip and `%` centered inside. Design: [`docs/superpowers/specs/2026-09-21-watch-progress-ring-design.md`](./superpowers/specs/2026-09-21-watch-progress-ring-design.md). Circular complication chrome is unchanged for now.
```

- [ ] **Step 2: Spec checklist (no code)**

Confirm each spec item is done:

| Spec item | Task |
|-----------|------|
| Full ring around `%` | Task 4 |
| Colorful progress continuum | Task 1 + 3 |
| Glowing tip, no pulse | Task 3 |
| Title above / remaining below | Task 4 |
| Life empty unchanged | Task 4 (else branch) |
| Complication out of scope | — skipped |
| A11y: ring hidden, text scales | Task 3–4 |

- [ ] **Step 3: Commit** (only if user asked)

```bash
git add docs/APPLE_WATCH.md
git commit -m "$(cat <<'EOF'
Document Watch Time Hub progress ring reskin.

EOF
)"
```

---

## Plan self-review

1. **Spec coverage:** Layout, color/glow, hub-only scope, a11y, Life empty, verification — all mapped to Tasks 1–5. Complication explicitly skipped.  
2. **Placeholders:** None; full Swift for color, ring, and page.  
3. **Types:** `WatchProgressColor.hex(for:)` / `rgb(for:)` consistent across tasks; `WatchProgressRing(progress:)` consumed by Task 4.  
4. **Duplication:** Shared + Watch App copies match existing clock/cache pattern; WatchMath symlink for tests.
