# Watch Interactive Ring · Wear Parity + Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-09-21-watch-interactive-ring-design.md`

**Goal:** Bring Wear OS Time Hub to colorful circular-ring parity with Apple Watch, and add continuous tip pulse, fill-on-appear, and tap bounce on both platforms.

**Architecture:** Wear gets JVM-testable `ProgressColor` plus a `ProgressRingView` (Canvas + `ValueAnimator`) wired into `TimePeriodPageView`. Apple Watch extends existing `WatchProgressRing` / `TimePeriodPageView` with SwiftUI animations and Reduce Motion gates. Timing and colors match the shared spec; no shared binary between platforms.

**Tech Stack:** Kotlin / Android Views / JUnit (Wear), SwiftUI / XCTest via WatchMath (Apple), existing period clocks unchanged

## Global Constraints

- Progress colors exactly: `#22C55E` (0) → `#F59E0B` (0.5) → `#EF4444` (1); RGB lerp; same piecewise rule as phone `getProgressColor` / `WatchProgressColor`
- Track `~#2A2A2E`, background `#0E0E10`; hide tip when progress `< 0.001`
- Motion: tip pulse ~1.2s loop (opacity ~0.25→0.55, scale ~1.0→1.15); fill-on-appear ~0.45s; tap bounce ~0.25s to ~1.06 scale
- Reduce Motion / `animatorDurationScale == 0`: no pulse, no bounce; fill at final value
- Wear: remove linear bar and primary passed-line chrome; keep remaining label; Life empty `Open UNTIL on phone`
- Apple: keep ring layout; motion only this pass
- Complications / tiles / phone UI unchanged
- Human-copy rules for any new user-visible strings (none expected)
- Do not commit unless the user explicitly asks (skip Commit steps or pause)
- Install Wear APK only on wear serial (`adb -s <wear> …`); never install wear APK onto phone

## File map

| File | Responsibility |
|------|----------------|
| `android/wear/.../ProgressColor.kt` | Pure color math |
| `android/wear/src/test/.../ProgressColorTest.kt` | Color unit tests |
| `android/wear/.../ProgressRingView.kt` | Ring draw + pulse + fill anim + tap bounce |
| `android/wear/.../TimePeriodPageView.kt` | Hub page chrome using ring |
| `ios/UNTILWatch Watch App/WatchProgressRing.swift` | Add pulse / fill appear / Reduce Motion |
| `ios/UNTILWatch Watch App/TimePeriodPageView.swift` | Tap bounce + appear trigger |
| `docs/WEAR_OS.md` | Short UI note + link to spec |
| `docs/APPLE_WATCH.md` | Short interactive note + link |

---

### Task 1: Wear `ProgressColor` (TDD)

**Files:**
- Create: `android/wear/src/main/java/app/until/time/watch/ProgressColor.kt`
- Create: `android/wear/src/test/java/app/until/time/watch/ProgressColorTest.kt`

**Interfaces:**
- Consumes: none
- Produces:
  - `object ProgressColor`
  - `fun argb(progress: Float): Int` — opaque ARGB
  - `fun hex(progress: Float): String` — `#RRGGBB` uppercase
  - Clamps 0…1; piecewise lerp start/mid/end as Watch

- [ ] **Step 1: Write failing tests**

```kotlin
package app.until.time.watch

import org.junit.Assert.assertEquals
import org.junit.Test

class ProgressColorTest {
    @Test fun start_is_green() = assertEquals("#22C55E", ProgressColor.hex(0f))
    @Test fun mid_is_amber() = assertEquals("#F59E0B", ProgressColor.hex(0.5f))
    @Test fun end_is_red() = assertEquals("#EF4444", ProgressColor.hex(1f))
    @Test fun clamps_low() = assertEquals("#22C55E", ProgressColor.hex(-1f))
    @Test fun clamps_high() = assertEquals("#EF4444", ProgressColor.hex(2f))
    @Test fun quarter_hex() = assertEquals("#8CB235", ProgressColor.hex(0.25f))
}
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd android && ./gradlew :wear:testDebugUnitTest --tests app.until.time.watch.ProgressColorTest
```

Expected: FAIL (unresolved `ProgressColor`)

- [ ] **Step 3: Implement**

```kotlin
package app.until.time.watch

import android.graphics.Color
import kotlin.math.roundToInt

object ProgressColor {
    private val start = floatArrayOf(0x22 / 255f, 0xC5 / 255f, 0x5E / 255f)
    private val mid = floatArrayOf(0xF5 / 255f, 0x9E / 255f, 0x0B / 255f)
    private val end = floatArrayOf(0xEF / 255f, 0x44 / 255f, 0x44 / 255f)

    fun rgb(progress: Float): FloatArray {
        val p = progress.coerceIn(0f, 1f)
        val from: FloatArray
        val to: FloatArray
        val t: Float
        if (p <= 0.5f) {
            from = start; to = mid; t = p * 2f
        } else {
            from = mid; to = end; t = (p - 0.5f) * 2f
        }
        return floatArrayOf(
            from[0] + (to[0] - from[0]) * t,
            from[1] + (to[1] - from[1]) * t,
            from[2] + (to[2] - from[2]) * t,
        )
    }

    fun argb(progress: Float): Int {
        val c = rgb(progress)
        return Color.rgb(
            (c[0] * 255f).roundToInt(),
            (c[1] * 255f).roundToInt(),
            (c[2] * 255f).roundToInt(),
        )
    }

    fun hex(progress: Float): String {
        val c = rgb(progress)
        fun b(x: Float) = (x * 255f).roundToInt()
        return String.format("#%02X%02X%02X", b(c[0]), b(c[1]), b(c[2]))
    }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd android && ./gradlew :wear:testDebugUnitTest --tests app.until.time.watch.ProgressColorTest
```

- [ ] **Step 5: Commit** (only if user asked)

---

### Task 2: Wear `ProgressRingView`

**Files:**
- Create: `android/wear/src/main/java/app/until/time/watch/ProgressRingView.kt`

**Interfaces:**
- Consumes: `ProgressColor.argb`
- Produces: `class ProgressRingView(context) : View`
  - `fun setProgress(progress: Float, animate: Boolean)`
  - `fun setMotionEnabled(enabled: Boolean)` — false when animator scale is 0
  - Continuous tip pulse while attached + motion enabled
  - Tap: scale bounce ~1.06 via `animate().scaleX/Y`
  - `importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO`

- [ ] **Step 1: Implement ring view**

Create `ProgressRingView.kt` with Canvas drawing:

- Track circle stroke `#2A2A2E`, stroke width ~11dp  
- Progress arc from `-90°`, sweep `360 * displayedProgress`, stroke `ProgressColor.argb(targetProgress)`, round caps  
- Tip at arc end: filled circle + halo (same color, alpha from pulse animator)  
- `ValueAnimator.ofFloat(0f, 1f)` infinite reverse 1200ms for pulse  
- `ValueAnimator` 450ms for fill from 0 → target when `animate=true`  
- On detach: cancel animators  
- `onTouchEvent`: ACTION_UP → bounce if motion enabled  

Sketch (implement fully; adjust dp via density):

```kotlin
package app.until.time.watch

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.DecelerateInterpolator
import androidx.core.graphics.ColorUtils

class ProgressRingView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {
    private val trackColor = 0xFF2A2A2E.toInt()
    private val strokeDp = 11f
    private val oval = RectF()
    private var targetProgress = 0f
    private var displayProgress = 0f
    private var pulseT = 0f
    private var motionEnabled = true
    private var fillAnimator: ValueAnimator? = null
    private var pulseAnimator: ValueAnimator? = null

    private val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        color = trackColor
    }
    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }
    private val tipPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val haloPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }

    init {
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
        isClickable = true
    }

    fun setMotionEnabled(enabled: Boolean) {
        motionEnabled = enabled
        if (!enabled) {
            pulseAnimator?.cancel()
            pulseT = 0f
            scaleX = 1f
            scaleY = 1f
            invalidate()
        } else if (isAttachedToWindow) {
            startPulse()
        }
    }

    fun setProgress(progress: Float, animate: Boolean) {
        targetProgress = progress.coerceIn(0f, 1f)
        fillAnimator?.cancel()
        val reduce = !motionEnabled || !animate
        if (reduce) {
            displayProgress = targetProgress
            invalidate()
            return
        }
        fillAnimator = ValueAnimator.ofFloat(0f, targetProgress).apply {
            duration = 450L
            interpolator = DecelerateInterpolator()
            addUpdateListener {
                displayProgress = it.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (motionEnabled) startPulse()
    }

    override fun onDetachedFromWindow() {
        pulseAnimator?.cancel()
        fillAnimator?.cancel()
        super.onDetachedFromWindow()
    }

    private fun startPulse() {
        pulseAnimator?.cancel()
        pulseAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 1200L
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener {
                pulseT = it.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    override fun onDraw(canvas: Canvas) {
        val stroke = strokeDp * resources.displayMetrics.density
        trackPaint.strokeWidth = stroke
        fillPaint.strokeWidth = stroke
        val pad = stroke / 2f
        oval.set(pad, pad, width - pad, height - pad)
        canvas.drawOval(oval, trackPaint)

        val color = ProgressColor.argb(targetProgress)
        fillPaint.color = color
        val sweep = 360f * displayProgress
        if (sweep > 0.1f) {
            canvas.drawArc(oval, -90f, sweep, false, fillPaint)
        }

        if (displayProgress > 0.001f) {
            val cx = oval.centerX()
            val cy = oval.centerY()
            val r = oval.width() / 2f
            val rad = Math.toRadians((-90f + sweep).toDouble())
            val tx = cx + r * Math.cos(rad).toFloat()
            val ty = cy + r * Math.sin(rad).toFloat()
            val tipR = stroke * 0.48f
            val haloScale = 1f + 0.15f * pulseT
            val haloAlpha = (0.25f + 0.30f * pulseT)
            haloPaint.color = ColorUtils.setAlphaComponent(color, (haloAlpha * 255).toInt())
            canvas.drawCircle(tx, ty, tipR * 2.2f * haloScale, haloPaint)
            tipPaint.color = color
            canvas.drawCircle(tx, ty, tipR, tipPaint)
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_UP && motionEnabled) {
            animate().cancel()
            animate().scaleX(1.06f).scaleY(1.06f).setDuration(120L).withEndAction {
                animate().scaleX(1f).scaleY(1f).setDuration(130L).start()
            }.start()
            performClick()
        }
        return super.onTouchEvent(event)
    }

    override fun performClick(): Boolean {
        super.performClick()
        return true
    }
}
```

- [ ] **Step 2: Compile Wear**

```bash
cd android && ./gradlew :wear:compileDebugKotlin
```

Expected: SUCCESS

- [ ] **Step 3: Commit** (only if user asked)

---

### Task 3: Wear `TimePeriodPageView` ring chrome

**Files:**
- Modify: `android/wear/src/main/java/app/until/time/watch/TimePeriodPageView.kt`

**Interfaces:**
- Consumes: `ProgressRingView`, `PeriodSnapshot`
- Produces: layout title → ring+`%` overlay → remaining; empty state unchanged

- [ ] **Step 1: Restructure page**

Replace linear `progressTrack` / `progressFill` / `passedView` with:

- `FrameLayout` holding `ProgressRingView` (match_parent square-ish via post layout or fixed side from `min(width,height)` after measure)  
- `percentView` centered in that FrameLayout (white `#EDEDED`, not orange `#E87C20`)  
- Keep `labelView` above; keep `leftView` (remaining) below; **remove** `passedView` and subtitle “of the day passed” if it crowds the dial (prefer Apple-like: title + % + remaining only). If removing subtitle breaks a test that asserts it, update the test.  
- On `bind` with snapshot: `ring.setProgress(snapshot.progressClamped, animate = true)`  
- On empty: hide ring, show empty message  
- Motion: `val scale = Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)`; `ring.setMotionEnabled(scale > 0f)`

Keep WO-V1: ScrollView, large-font insets via `WearLayoutMetrics`, essential text not clipped.

- [ ] **Step 2: Unit-test still green**

```bash
cd android && ./gradlew :wear:testDebugUnitTest
```

- [ ] **Step 3: Install on Wear emulator only**

```bash
cd android && ./gradlew :wear:assembleDebug
adb -s emulator-5556 install -r wear/build/outputs/apk/debug/wear-debug.apk
adb -s emulator-5556 shell am start -n app.until.time/app.until.time.watch.TimeHubActivity
```

(Adjust serial via `adb devices -l`.) Manually: swipe pages, tap ring, confirm pulse.

- [ ] **Step 4: Commit** (only if user asked)

---

### Task 4: Apple Watch ring motion

**Files:**
- Modify: `ios/UNTILWatch Watch App/WatchProgressRing.swift`
- Modify: `ios/UNTILWatch Watch App/TimePeriodPageView.swift`

**Interfaces:**
- Consumes: existing `WatchProgressColor`, `accessibilityReduceMotion`
- Produces: pulsing tip halo; animated fill on appear; tap bounce

- [ ] **Step 1: Extend `WatchProgressRing`**

Add:

```swift
@Environment(\.accessibilityReduceMotion) private var reduceMotion
@State private var displayProgress: Double = 0
@State private var pulse: Bool = false
var onAppearToken: Int = 0 // bump from parent to re-trigger fill

// In body tip halo:
.scaleEffect(pulse && !reduceMotion ? 1.15 : 1.0)
.opacity(pulse && !reduceMotion ? 0.55 : 0.35)
.animation(
  reduceMotion ? nil : .easeInOut(duration: 1.2).repeatForever(autoreverses: true),
  value: pulse
)

// Fill trim uses displayProgress instead of clamped
.onAppear {
  if reduceMotion {
    displayProgress = clamped
  } else {
    displayProgress = 0
    withAnimation(.easeOut(duration: 0.45)) { displayProgress = clamped }
  }
  pulse = !reduceMotion
}
.onChange(of: progress) { _, newValue in
  let p = min(1, max(0, newValue))
  if reduceMotion { displayProgress = p }
  else { withAnimation(.easeOut(duration: 0.45)) { displayProgress = p } }
}
.onChange(of: onAppearToken) { _, _ in
  // same as onAppear fill restart
}
```

Keep tip hidden when `displayProgress < 0.001`. Keep `strokeBorder` + inset geometry from prior tip fix.

- [ ] **Step 2: Wire tap + appear in `TimePeriodPageView`**

```swift
@State private var appearToken = 0
@State private var bounce = false
@Environment(\.accessibilityReduceMotion) private var reduceMotion

// ZStack ring:
WatchProgressRing(progress: snapshot.progressClamped, onAppearToken: appearToken)
  .scaleEffect(bounce ? 1.06 : 1.0)
  .animation(reduceMotion ? nil : .easeInOut(duration: 0.12), value: bounce)
  .onTapGesture {
    guard !reduceMotion else { return }
    bounce = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { bounce = false }
    #if os(watchOS)
    // optional: WKInterfaceDevice.current().play(.click)
    #endif
  }
.onAppear { appearToken += 1 }
```

Percent text remains centered; tap on ZStack is fine.

- [ ] **Step 3: Build Watch App target**

```bash
xcodebuild -project ios/UNTIL.xcodeproj -target "UNTILWatch Watch App" \
  -destination 'generic/platform=watchOS' -configuration Debug build
```

Expected: BUILD SUCCEEDED (or workspace if pods required — use target-only as before).

- [ ] **Step 4: Commit** (only if user asked)

---

### Task 5: Docs + verification checklist

**Files:**
- Modify: `docs/WEAR_OS.md`
- Modify: `docs/APPLE_WATCH.md`
- Update status line in `docs/superpowers/specs/2026-09-21-watch-interactive-ring-design.md` to `Approved`

- [ ] **Step 1: Doc notes**

Wear — after Time Hub description, add:

```markdown
**Hub UI (2026-09-21 interactive):** Colorful circular progress ring (green→amber→red) with pulsing tip, fill-on-appear, and tap bounce. Design: [`docs/superpowers/specs/2026-09-21-watch-interactive-ring-design.md`](./superpowers/specs/2026-09-21-watch-interactive-ring-design.md). Tiles/complications unchanged.
```

Apple — extend the existing Time Hub UI note:

```markdown
Interactive (same spec): continuous tip pulse, fill-on-appear, tap bounce; respects Reduce Motion.
```

- [ ] **Step 2: Spec checklist**

| Spec item | Task |
|-----------|------|
| Wear ring parity | 2–3 |
| Continuous tip pulse | 2, 4 |
| Fill-on-appear | 2, 4 |
| Tap bounce | 2, 4 |
| Reduce Motion | 3–4 |
| Complications unchanged | — |
| Color continuum | 1, 4 |

- [ ] **Step 3: Commit** (only if user asked)

---

## Plan self-review

1. **Spec coverage:** Wear parity, Apple motion, pulse/fill/bounce, Reduce Motion, docs, verification — Tasks 1–5.  
2. **Placeholders:** None; concrete Kotlin/Swift.  
3. **Types:** `ProgressColor.hex/argb`, `ProgressRingView.setProgress/setMotionEnabled`, `WatchProgressRing` `onAppearToken` — consistent.  
4. **Install hygiene:** Wear install commands pin serial.
