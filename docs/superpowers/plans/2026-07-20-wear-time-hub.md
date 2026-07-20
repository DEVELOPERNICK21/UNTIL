# Wear OS Time Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single Wear Day screen with a horizontal swipe hub (Day → Month → Year → Life), computing Day/Month/Year on the watch clock and syncing birth profile from the phone for Life.

**Architecture:** Pure Kotlin `TimeClock` / `LifeClock` on Wear; `ProfileStore` for `birthDate` + `deathAge`; `TimeHubActivity` hosts ViewPager2 with four shared-layout pages; phone `WearDaySync` extends `/until/day` JSON with profile fields. Tile and complication stay Day-only and open the hub.

**Tech Stack:** Kotlin, Android Views, ViewPager2, Play Services Wearable, SharedPreferences, JUnit (Wear JVM unit tests for clock math)

**Spec:** [`docs/superpowers/specs/2026-07-20-wear-time-hub-design.md`](../specs/2026-07-20-wear-time-hub-design.md)

## Global Constraints

- Wear `applicationId` remains `app.until.time` (same Play listing as phone)
- Kotlin `namespace` / package stays `app.until.time.watch`
- Tile + complication: Day only — do not add Month/Year/Life tiles
- No Premium checks on Wear
- Match phone math: Day ms-based; Month `(dayOfMonth - 1) / daysInMonth`; Year `dayOfYear / daysInYear`; Life like `getLifeProgress` with default death age **80**
- Colors: bg `#0E0E10`, % `#E87C20`, bar `#AA2222` / `#22AA22`
- Data path stays `/until/day` and request `/until/day/request`
- MMKV profile keys on phone: `user.birthDate`, `user.deathAge` (id `until-storage`)

---

## File structure

| File | Responsibility |
|------|----------------|
| `android/wear/.../PeriodSnapshot.kt` | Shared progress model for any period page |
| `android/wear/.../TimeClock.kt` | Day / month / year snapshots from `Calendar` |
| `android/wear/.../LifeClock.kt` | Life snapshot from birth + death age |
| `android/wear/.../ProfileStore.kt` | Persist/load birthDate + deathAge |
| `android/wear/.../TimePeriodPageView.kt` | One page chrome (label, %, bar, lines, footer) |
| `android/wear/.../TimeHubActivity.kt` | ViewPager2 + dots + tick + sync request |
| `android/wear/.../TimeHubPagerAdapter.kt` | 4 pages adapter |
| `android/wear/.../DayClock.kt` | Thin wrapper: `DayClock.snapshot()` → `TimeClock.day()` (tile/complication) |
| `android/wear/.../DayActivity.kt` | Delete after hub ships (or keep as deprecated alias — prefer delete) |
| `android/wear/.../DayDataListenerService.kt` | Also write `ProfileStore` from JSON |
| `android/wear/.../DayTileService.kt` | Launch `TimeHubActivity` |
| `android/wear/src/main/AndroidManifest.xml` | Launcher → `TimeHubActivity` |
| `android/wear/build.gradle` | `viewpager2` + `junit` test deps |
| `android/wear/src/test/java/.../TimeClockTest.kt` | Unit tests day/month/year |
| `android/wear/src/test/java/.../LifeClockTest.kt` | Unit tests life |
| `android/app/.../WearDaySync.kt` | Add birthDate / deathAge to push |
| `android/app/.../UNTILWidgetWorker.kt` | Load profile from MMKV; pass into `WearDaySync.push` |
| `docs/WEAR_OS.md` | Document Time Hub |

---

### Task 1: PeriodSnapshot + TimeClock (watch-local Day/Month/Year)

**Files:**
- Create: `android/wear/src/main/java/app/until/time/watch/PeriodSnapshot.kt`
- Create: `android/wear/src/main/java/app/until/time/watch/TimeClock.kt`
- Create: `android/wear/src/test/java/app/until/time/watch/TimeClockTest.kt`
- Modify: `android/wear/build.gradle` (add test + viewpager2 deps — viewpager2 used in Task 4; add both here)
- Modify: `android/wear/src/main/java/app/until/time/watch/DayClock.kt` (delegate to `TimeClock.day`)

**Interfaces:**
- Produces:
  - `data class PeriodSnapshot(val progress: Double, val percentDone: Int, val percentLeft: Int, val startMs: Long?, val endMs: Long?, val remainingLabel: String, val passedLabel: String, val whisper: String, val updatedAt: Long)`
  - `object TimeClock { fun day(nowMs: Long = …): PeriodSnapshot; fun month(nowMs: Long = …): PeriodSnapshot; fun year(nowMs: Long = …): PeriodSnapshot }`
- Consumes: nothing from later tasks

- [ ] **Step 1: Add test dependencies to wear `build.gradle`**

In `dependencies { }`:

```gradle
implementation("androidx.viewpager2:viewpager2:1.1.0")
testImplementation("junit:junit:4.13.2")
```

- [ ] **Step 2: Write failing `TimeClockTest`**

```kotlin
package app.until.time.watch

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class TimeClockTest {
    private fun ms(y: Int, month0: Int, day: Int, h: Int, m: Int, s: Int = 0): Long {
        val c = Calendar.getInstance(TimeZone.getDefault())
        c.set(y, month0, day, h, m, s)
        c.set(Calendar.MILLISECOND, 0)
        return c.timeInMillis
    }

    @Test
    fun day_at_noon_is_near_50_percent() {
        val snap = TimeClock.day(ms(2026, Calendar.JULY, 20, 12, 0))
        assertTrue(snap.percentDone in 49..51)
    }

    @Test
    fun month_on_first_is_zero() {
        val snap = TimeClock.month(ms(2026, Calendar.JULY, 1, 8, 0))
        assertEquals(0, snap.percentDone)
    }

    @Test
    fun year_on_jan_1_near_zero() {
        val snap = TimeClock.year(ms(2026, Calendar.JANUARY, 1, 1, 0))
        assertTrue(snap.percentDone <= 1)
    }
}
```

- [ ] **Step 3: Run test — expect FAIL (TimeClock missing)**

```bash
cd android && ./gradlew :wear:testDebugUnitTest --tests app.until.time.watch.TimeClockTest
```

Expected: FAIL compiling / class not found

- [ ] **Step 4: Implement `PeriodSnapshot` + `TimeClock`**

`PeriodSnapshot.kt`:

```kotlin
package app.until.time.watch

data class PeriodSnapshot(
    val progress: Double,
    val percentDone: Int,
    val percentLeft: Int,
    val startMs: Long?,
    val endMs: Long?,
    val remainingLabel: String,
    val passedLabel: String,
    val whisper: String,
    val updatedAt: Long,
) {
    val progressClamped: Float
        get() = progress.toFloat().coerceIn(0f, 1f)
}
```

`TimeClock.kt` — implement:

- **day:** same bounds as current `DayClock` (start/end of local day); `remainingLabel` / `passedLabel` as `Xh Ym Zs left/passed`; whisper via existing thresholds from `DayClock.whisper`
- **month:** `progress = (dayOfMonth - 1).toDouble() / daysInMonth`; `remainingLabel = "${remainingDays} days left"`; `passedLabel = "Day $dayOfMonth of $daysInMonth"`; whisper can reuse day-style thresholds on `progress`
- **year:** `dayOfYear` / `daysInYear` (leap-aware); `remainingLabel = "${remainingDays} days left"`; `passedLabel = "Day $dayOfYear of $daysInYear"`

- [ ] **Step 5: Point `DayClock` at `TimeClock.day` for tile/complication compatibility**

Keep `DayWearCache` mapping:

```kotlin
object DayClock {
    fun snapshot(nowMs: Long = System.currentTimeMillis()): DayWearCache {
        val p = TimeClock.day(nowMs)
        return DayWearCache(
            dayProgress = p.progress,
            dayPercentDone = p.percentDone,
            dayPercentLeft = p.percentLeft,
            startOfDay = p.startMs,
            endOfDay = p.endMs,
            dayRemainingMinutes = ((p.endMs ?: nowMs) - nowMs).coerceAtLeast(0L).div(60_000L).toInt(),
            dayHoursLeft = ((p.endMs ?: nowMs) - nowMs).coerceAtLeast(0L) / 3_600_000.0,
            updatedAt = p.updatedAt,
        )
    }

    fun whisper(progress: Double): String = TimeClock.whisperFor(progress)
}
```

Move whisper helper onto `TimeClock` as `whisperFor(progress: Double)`.

- [ ] **Step 6: Re-run unit tests — expect PASS**

```bash
cd android && ./gradlew :wear:testDebugUnitTest --tests app.until.time.watch.TimeClockTest
```

- [ ] **Step 7: Commit**

```bash
git add android/wear/build.gradle \
  android/wear/src/main/java/app/until/time/watch/PeriodSnapshot.kt \
  android/wear/src/main/java/app/until/time/watch/TimeClock.kt \
  android/wear/src/main/java/app/until/time/watch/DayClock.kt \
  android/wear/src/test/java/app/until/time/watch/TimeClockTest.kt
git commit -m "$(cat <<'EOF'
feat(wear): add TimeClock for day/month/year snapshots

EOF
)"
```

---

### Task 2: LifeClock + ProfileStore

**Files:**
- Create: `android/wear/src/main/java/app/until/time/watch/ProfileStore.kt`
- Create: `android/wear/src/main/java/app/until/time/watch/LifeClock.kt`
- Create: `android/wear/src/test/java/app/until/time/watch/LifeClockTest.kt`

**Interfaces:**
- Consumes: `PeriodSnapshot`
- Produces:
  - `object ProfileStore { fun load(context): Profile?; fun save(context, birthDate: String, deathAge: Int); data class Profile(val birthDate: String, val deathAge: Int) }`
  - `object LifeClock { fun snapshot(profile: ProfileStore.Profile?, nowMs: Long = …): PeriodSnapshot? }` — returns `null` if no/invalid birthDate

- [ ] **Step 1: Write failing `LifeClockTest`**

```kotlin
package app.until.time.watch

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import java.util.Calendar

class LifeClockTest {
    @Test
    fun null_profile_returns_null() {
        assertNull(LifeClock.snapshot(null))
    }

    @Test
    fun mid_life_near_50_for_age_40_of_80() {
        val birth = Calendar.getInstance().apply {
            add(Calendar.YEAR, -40)
        }
        val iso = String.format(
            "%04d-%02d-%02d",
            birth.get(Calendar.YEAR),
            birth.get(Calendar.MONTH) + 1,
            birth.get(Calendar.DAY_OF_MONTH),
        )
        val snap = LifeClock.snapshot(ProfileStore.Profile(iso, 80))
        assertNotNull(snap)
        assertEquals(50, snap!!.percentDone, /* delta */ 3)
        // If assertEquals for Int with delta not available, use:
        // assertTrue(snap.percentDone in 47..53)
    }
}
```

Use `assertTrue(snap.percentDone in 47..53)` if needed.

- [ ] **Step 2: Run — expect FAIL**

```bash
cd android && ./gradlew :wear:testDebugUnitTest --tests app.until.time.watch.LifeClockTest
```

- [ ] **Step 3: Implement `ProfileStore` + `LifeClock`**

`ProfileStore` prefs name `until_wear_profile`; keys `birthDate`, `deathAge`.

`LifeClock`: parse ISO `YYYY-MM-DD` with `Calendar`; death = birth + deathAge years; `progress = elapsed / total` clamped 0..1; default deathAge 80 if `<= 0`; `remainingLabel` like `"${yearsLeft}y left"` (yearsLeft from ms / 365.25d); `passedLabel` like `"${yearsLived}y lived"`; empty whisper `"Synced profile"` or period-based whisper.

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd android && ./gradlew :wear:testDebugUnitTest --tests "app.until.time.watch.*"
```

- [ ] **Step 5: Commit**

```bash
git add android/wear/src/main/java/app/until/time/watch/ProfileStore.kt \
  android/wear/src/main/java/app/until/time/watch/LifeClock.kt \
  android/wear/src/test/java/app/until/time/watch/LifeClockTest.kt
git commit -m "$(cat <<'EOF'
feat(wear): add LifeClock and ProfileStore

EOF
)"
```

---

### Task 3: Phone sync — birthDate + deathAge on WearDaySync

**Files:**
- Modify: `android/app/src/main/java/app/until/time/WearDaySync.kt`
- Modify: `android/app/src/main/java/app/until/time/UNTILWidgetWorker.kt` (WearDaySync.push call site ~279)
- Modify: `android/wear/src/main/java/app/until/time/watch/DayDataListenerService.kt`

**Interfaces:**
- Consumes: MMKV keys `user.birthDate`, `user.deathAge` in id `until-storage`
- Produces: JSON fields `birthDate` (string), `deathAge` (int) on `/until/day` payload; Wear `ProfileStore.save` when present

- [ ] **Step 1: Extend `WearDaySync.push` signature**

Add optional params:

```kotlin
birthDate: String? = null,
deathAge: Int? = null,
```

Put into `JSONObject` only when `birthDate` is non-null/non-blank. Also put into `DataMap` when present (`putString` / `putInt`).

- [ ] **Step 2: Load profile in `UNTILWidgetWorker` before push**

```kotlin
private fun loadUserProfile(context: Context): Pair<String?, Int> {
    return try {
        MMKV.initialize(context)
        val mmkv = MMKV.mmkvWithID(MMKV_ID) ?: return null to 80
        val birth = mmkv.decodeString("user.birthDate")
        val death = if (mmkv.containsKey("user.deathAge")) {
            mmkv.decodeInt("user.deathAge", 80)
        } else 80
        birth to death
    } catch (_: Exception) {
        null to 80
    }
}
```

At `WearDaySync.push(...)`:

```kotlin
val (birth, deathAge) = loadUserProfile(context)
WearDaySync.push(
    context = context,
    dayProgress = cache.dayProgress,
    // ...existing day fields...
    birthDate = birth,
    deathAge = deathAge,
)
```

(`WearSyncRequestService` already calls `UNTILWidgetWorker.updateWidgets` — no change needed if push always includes profile.)

- [ ] **Step 3: In `DayDataListenerService.applyJson`, save profile**

After parsing day fields:

```kotlin
val birth = o.optString("birthDate", "").trim()
if (birth.isNotEmpty()) {
    val death = o.optInt("deathAge", 80).let { if (it <= 0) 80 else it }
    ProfileStore.save(this, birth, death)
}
```

Also handle DataMap branch: if `map.containsKey("birthDate")` save similarly.

Keep broadcasting refresh — update action to `TimeHubActivity.ACTION_REFRESH` in Task 4; for now still use `DayActivity.ACTION_REFRESH` until hub lands, or introduce constant early:

```kotlin
// Prefer defining ACTION_REFRESH on TimeHubActivity in Task 4;
// in this task keep DayActivity.ACTION_REFRESH and update in Task 4.
```

- [ ] **Step 4: Manual check (optional adb)**

Build phone + wear debug; open phone UNTIL with birth date set; confirm Wear log / prefs contain birth after sync.

- [ ] **Step 5: Commit**

```bash
git add android/app/src/main/java/app/until/time/WearDaySync.kt \
  android/app/src/main/java/app/until/time/UNTILWidgetWorker.kt \
  android/wear/src/main/java/app/until/time/watch/DayDataListenerService.kt
git commit -m "$(cat <<'EOF'
feat(wear): sync birthDate and deathAge to watch

EOF
)"
```

---

### Task 4: TimeHubActivity + pager UI

**Files:**
- Create: `android/wear/src/main/java/app/until/time/watch/TimePeriodPageView.kt`
- Create: `android/wear/src/main/java/app/until/time/watch/TimeHubPagerAdapter.kt`
- Create: `android/wear/src/main/java/app/until/time/watch/TimeHubActivity.kt`
- Modify: `android/wear/src/main/AndroidManifest.xml`
- Modify: `android/wear/src/main/java/app/until/time/watch/DayTileService.kt` (launch hub)
- Modify: `android/wear/src/main/java/app/until/time/watch/DayDataListenerService.kt` (broadcast hub refresh)
- Delete: `android/wear/src/main/java/app/until/time/watch/DayActivity.kt` (after hub works)

**Interfaces:**
- Consumes: `TimeClock`, `LifeClock`, `ProfileStore`, `PeriodSnapshot`
- Produces: `TimeHubActivity` launcher; `ACTION_REFRESH = "app.until.time.watch.DAY_REFRESH"` (keep same string so old broadcasts still work)

- [ ] **Step 1: Build `TimePeriodPageView`**

Programmatic `LinearLayout` matching current Day chrome (label, %, subtitle “of … passed”, bar, passed, left, footer). Methods:

```kotlin
fun bind(label: String, snapshot: PeriodSnapshot?, emptyMessage: String? = null)
```

When `snapshot == null`, show `emptyMessage` (e.g. `"Open UNTIL on phone"`) and hide or dash the %.

- [ ] **Step 2: `TimeHubPagerAdapter`**

4 pages: indices `0=Day, 1=Month, 2=Year, 3=Life`.

```kotlin
enum class TimePage { DAY, MONTH, YEAR, LIFE }

class TimeHubPagerAdapter(
    private val inflatePage: (TimePage) -> TimePeriodPageView,
) : RecyclerView.Adapter<…>() {
    // getItemCount() = 4
}
```

Simpler approach without custom ViewHolder complexity: Activity creates 4 `TimePeriodPageView`s and uses `RecyclerView.Adapter` that returns those views, **or** use `ViewPager2` with adapter that binds on `onBindViewHolder` by calling `TimeClock` / `LifeClock` each bind + expose `refreshAll()` from activity.

Recommended: Activity owns `pages: List<TimePeriodPageView>` and a thin adapter; `fun rebindAll()`:

```kotlin
pages[0].bind("TODAY", TimeClock.day())
pages[1].bind("THIS MONTH", TimeClock.month())
pages[2].bind("THIS YEAR", TimeClock.year())
pages[3].bind(
    "LIFE",
    LifeClock.snapshot(ProfileStore.load(this)),
    emptyMessage = "Open UNTIL on phone",
)
```

- [ ] **Step 3: `TimeHubActivity`**

- Root: vertical `LinearLayout` → `ViewPager2` (weight 1) + horizontal dots row
- 1s `Handler` tick → `rebindAll()`
- Register `ACTION_REFRESH` receiver like `DayActivity`
- `requestSyncFromPhone()` same MessageClient `/until/day/request`
- Dots: 4 small views; active fill `#E87C20`, inactive `#6A6A6A`; update on `ViewPager2.OnPageChangeCallback`
- Start on page 0 (Day)

- [ ] **Step 4: Manifest — launcher activity**

Replace `.DayActivity` with `.TimeHubActivity` (same intent-filters).

- [ ] **Step 5: Update tile + listener**

`DayTileService`: `TimeHubActivity::class.java.name` in LaunchAction.

`DayDataListenerService.notifyUi`:

```kotlin
sendBroadcast(Intent(TimeHubActivity.ACTION_REFRESH).setPackage(packageName))
```

- [ ] **Step 6: Delete `DayActivity.kt`** after compile succeeds; fix any remaining references.

- [ ] **Step 7: Install on Wear emulator/device**

```bash
cd android
./gradlew :wear:installDebug
adb -s <wear-serial> shell am start -n app.until.time/app.until.time.watch.TimeHubActivity
```

Verify swipe Day→Month→Year→Life; Life empty without profile; after phone open with birth date, Life fills.

- [ ] **Step 8: Commit**

```bash
git add android/wear/src/main/java/app/until/time/watch/ \
  android/wear/src/main/AndroidManifest.xml
git commit -m "$(cat <<'EOF'
feat(wear): add Time Hub pager for day/month/year/life

EOF
)"
```

---

### Task 5: Docs + release notes touch

**Files:**
- Modify: `docs/WEAR_OS.md`
- Modify: `docs/superpowers/specs/2026-07-20-wear-time-hub-design.md` (status → Implemented) optional

- [ ] **Step 1: Update WEAR_OS architecture section**

Document Time Hub pages, profile sync fields, launcher `TimeHubActivity`, adb start component, tile still Day-only.

- [ ] **Step 2: Commit**

```bash
git add docs/WEAR_OS.md
git commit -m "$(cat <<'EOF'
docs(wear): document Time Hub and profile sync

EOF
)"
```

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Horizontal swipe Day/Month/Year/Life | 4 |
| Page dots | 4 |
| Day/Month/Year watch clock | 1 |
| Life needs phone profile | 2, 3 |
| Tile/complication Day only | 4 (launch hub only) |
| Free / no Premium | (no gating code) |
| Extend `/until/day` with birthDate/deathAge | 3 |
| Match core month/year/life math | 1, 2 |
| Update WEAR_OS.md | 5 |

## Placeholder / consistency check

- `ACTION_REFRESH` string stays `app.until.time.watch.DAY_REFRESH`
- `DayWearCache` retained for tile/complication
- Phone MMKV keys exactly `user.birthDate` / `user.deathAge`
- ViewPager2 dependency added in Task 1

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-20-wear-time-hub.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — run tasks in this session with checkpoints  

Which approach?
