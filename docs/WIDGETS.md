# UNTIL Widgets – Developer Guide

How to add or modify widgets for iOS and Android. Use this doc when creating a new widget.

**Related:** [Dynamic Island Live Activity](DynamicIslandLiveActivity.md) – design for iOS Live Activity / Dynamic Island (day, month, year, daily tasks, hour calc, life).

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  JS/TS App                                                       │
│  WidgetSync computes data → MMKV + WidgetBridge (iOS)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Native Widgets read cached JSON                                 │
│  iOS: UserDefaults (App Group) | Android: MMKV via WorkManager   │
└─────────────────────────────────────────────────────────────────┘
```

**Rules:**
- All time logic lives in `core/time` – widgets only read cached JSON
- Shared data contract: `surfaces/widgets/dataContract.ts`
- Storage key: `widget.cache` (from `persistence/schema.ts`)

---

## Lock Screen Widgets (SSOT)

Lock screen widgets use the **same data** as home screen widgets. No new cache keys or use cases.

| Platform | Implementation |
|----------|----------------|
| **iOS** | Day, Month, Year widgets support accessory families: `.accessoryInline`, `.accessoryCircular`, `.accessoryRectangular`. Add to Lock Screen via the widget picker. |
| **Android** | Day, Month, Year have `widgetCategory="home_screen\|keyguard"` so they can be placed on lock screen (Android 15+ on supported devices). Same layout as home. |

**Architecture:** SyncWidgetUseCase → WidgetCache → WidgetSync → MMKV/UserDefaults. Lock screen views are presentation-only; they read the same cached JSON.

---

## Design Tokens (Match Across Platforms)

| Token   | Hex       | Usage                |
|---------|-----------|----------------------|
| Background | `#0E0E10` | Widget background   |
| Passed/Done | `#AA2222` | Red – passed time   |
| Left     | `#22AA22` | Green – remaining   |
| Percent  | `#E87C20` | Orange – highlight  |
| Label size | 12sp/pt  | Small text          |
| Value size | 18sp/pt  | Main value          |
| Placeholder | "Open UNTIL to sync" | No data state |

---

## File Reference

### Shared (TypeScript)

| File | Purpose |
|------|---------|
| `src/persistence/schema.ts` | `WIDGET_CACHE: 'widget.cache'` – keep key in sync with native |
| `src/surfaces/widgets/dataContract.ts` | `WidgetCache` – add new fields here for new data |
| `src/infrastructure/WidgetSync.ts` | Compute + write cache – add new field logic here |

### iOS

| File | Purpose |
|------|---------|
| `ios/UNTIL/WidgetBridge.swift` | Writes JSON to UserDefaults App Group (no edits for new widgets) |
| `ios/UNTILWidgets/WidgetMMKV.swift` | Reads JSON from App Group (no edits for new widgets) |
| `ios/UNTILWidgets/UNTILWidgets.swift` | Model, views, providers, bundle, lock screen accessory views – **edit for new widget** |

### Android

| File | Purpose |
|------|---------|
| `android/.../UNTILWidgetWorker.kt` | Loads cache, builds RemoteViews – **edit for new widget** |
| `android/.../UNTIL*WidgetProvider.kt` | One provider per widget – **create new for new widget** |
| `android/.../res/layout/widget_*.xml` | Layout – **create new for new widget** |
| `android/.../res/xml/widget_*_info.xml` | Widget config – **create new for new widget** |
| `android/.../AndroidManifest.xml` | Receiver registration – **add receiver** |
| `android/.../res/values/strings.xml` | Description – **add string** |

---

## Step-by-Step: Add a New Widget (e.g. "Week")

### Step 1: Data Contract

**File:** `src/surfaces/widgets/dataContract.ts`

Add fields to `WidgetCache`:

```ts
export interface WidgetCache {
  // ... existing fields
  weekProgress: number;      // 0–1
  weekPercent: number;       // 0–100
  weekDaysPassed: number;
  weekDaysLeft: number;
  updatedAt: number;
}
```

---

### Step 2: Core Logic (if needed)

**File:** `src/core/time/week.ts` (create if needed)

```ts
export function getWeekProgress(date: Date): WeekProgress {
  // ... compute from clock.ts
}
```

---

### Step 3: WidgetSync

**File:** `src/infrastructure/WidgetSync.ts`

- Import and call the new core function (e.g. `getWeekProgress`)
- Add the new fields to the returned object in `computeWidgetCache()`

---

### Step 4: iOS – SwiftUI Widget

**File:** `ios/UNTILWidgets/UNTILWidgets.swift`

1. **Extend `WidgetCache`**

```swift
struct WidgetCache: Codable {
  // ... existing
  let weekProgress: Double
  let weekPercent: Int
  let weekDaysPassed: Int
  let weekDaysLeft: Int
}
```

2. **Add View**

```swift
struct WeekWidgetView: View {
    let entry: UNTILWidgetEntry

    var body: some View {
        Group {
            if let cache = entry.cache {
                VStack(alignment: .leading, spacing: 6) {
                    Text("\(cache.weekDaysPassed)d passed")
                        .foregroundColor(Design.passed)
                    Text("\(cache.weekDaysLeft)d left")
                        .foregroundColor(Design.left)
                    Text("\(cache.weekPercent)% of week")
                        .foregroundColor(Design.percent)
                    // Progress bar...
                }
                .background(Design.background)
            } else {
                Text("Open UNTIL to sync").foregroundColor(.gray)
            }
        }
        .containerBackground(Design.background, for: .widget)
    }
}
```

3. **Add Widget configuration**

```swift
struct WeekWidget: Widget {
    let kind: String = "UNTILWeekWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: UNTILWidgetProvider()) { entry in
            WeekWidgetView(entry: entry)
        }
        .configurationDisplayName("UNTIL Week")
        .description("See your week progress.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

4. **Register in bundle**

```swift
@main
struct UNTILWidgetsBundle: WidgetBundle {
    var body: some Widget {
        DayWidget()
        MonthWidget()
        YearWidget()
        WeekWidget()   // Add this
    }
}
```

---

### Step 5: Android – Provider

**File:** `android/app/src/main/java/app/until/time/UNTILWeekWidgetProvider.kt` (or equivalent under package `app.until.time`)

```kotlin
package app.until.time

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

class UNTILWeekWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        UNTILWidgetWorker.updateWidgets(context)
    }

    override fun onEnabled(context: Context) {
        UNTILWidgetWorker.schedule(context)
    }
}
```

---

### Step 6: Android – Layout

**File:** `android/app/src/main/res/layout/widget_week.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#0E0E10"
    android:orientation="vertical"
    android:padding="16dp">

    <TextView
        android:id="@+id/widget_week_passed"
        android:textColor="#AA2222"
        android:textSize="12sp" />

    <TextView
        android:id="@+id/widget_week_left"
        android:textColor="#22AA22"
        android:textSize="12sp" />

    <TextView
        android:id="@+id/widget_week_percent"
        android:textColor="#E87C20"
        android:textSize="18sp"
        android:textStyle="bold" />

    <ProgressBar
        android:id="@+id/widget_week_progress"
        style="?android:attr/progressBarStyleHorizontal"
        android:max="100"
        android:progressTint="#E87C20" />
</LinearLayout>
```

---

### Step 7: Android – Widget Config

**File:** `android/app/src/main/res/xml/widget_week_info.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="110dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="900000"
    android:initialLayout="@layout/widget_week"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:description="@string/widget_week_description" />
```

---

### Step 8: Android – String

**File:** `android/app/src/main/res/values/strings.xml`

```xml
<string name="widget_week_description">See your week progress.</string>
```

---

### Step 9: Android – Manifest

**File:** `android/app/src/main/AndroidManifest.xml`

Add inside `<application>`:

```xml
<receiver
    android:name=".UNTILWeekWidgetProvider"
    android:exported="true"
    android:label="UNTIL Week">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_week_info" />
</receiver>
```

---

### Step 10: Android – Worker

**File:** `android/app/src/main/java/com/until/UNTILWidgetWorker.kt`

1. Add to `providers` array:
```kotlin
ComponentName(context, UNTILWeekWidgetProvider::class.java),
```

2. Add to `when` in `buildRemoteViews`:
```kotlin
providerClass.endsWith("UNTILWeekWidgetProvider") -> R.layout.widget_week
```

3. Add branch in `buildRemoteViews`:
```kotlin
R.layout.widget_week -> {
    views.setTextViewText(R.id.widget_week_passed, "${cache.weekDaysPassed}d passed")
    views.setTextViewText(R.id.widget_week_left, "${cache.weekDaysLeft}d left")
    views.setTextViewText(R.id.widget_week_percent, "${cache.weekPercent}% of week")
    views.setProgressBar(R.id.widget_week_progress, 100, (cache.weekProgress * 100).toInt(), false)
}
```

4. Add to `WidgetCache` and `parseCache`:
```kotlin
weekProgress: Double,
weekPercent: Int,
weekDaysPassed: Int,
weekDaysLeft: Int,
```

```kotlin
weekProgress = obj.optDouble("weekProgress", 0.0),
weekPercent = obj.optInt("weekPercent", 0),
weekDaysPassed = obj.optInt("weekDaysPassed", 0),
weekDaysLeft = obj.optInt("weekDaysLeft", 0),
```

---

## Checklist for New Widget

- [ ] `dataContract.ts` – new fields in `WidgetCache`
- [ ] `core/time/*.ts` – logic if needed
- [ ] `WidgetSync.ts` – compute and add new fields
- [ ] **iOS:** `WidgetCache` + view + `Widget` + `UNTILWidgetsBundle`
- [ ] **Android:** Provider, layout, xml config, string, manifest, worker

---

## Troubleshooting

### iOS: "Open UNTIL to sync"
- Main app must run to write cache
- Check App Group: `group.com.until.app` in app + extension entitlements
- Run main app, then add widget

### Android: Widget shows old or empty data
- Run main app once so cache is written
- WorkManager updates every 30 min; can enqueue one-time work for immediate update
- Verify MMKV key: `widget.cache`, instance: `until-storage`

### JSON keys must match
- Use camelCase and same names in TS, Swift, and Kotlin
- Typo in key = `undefined` / null on native side

### iOS build fails
- Run `pod install` in `ios/`
- Enable App Group capability for app and widget extension in Xcode

### Android build fails
- `flatMap` over `IntArray`: use `.toList()` – `getAppWidgetIds(it).toList()`
- MMKV: call `MMKV.initialize(context)` before use

---

## Widget Update Policies (SSOT)

All time logic lives in `core/time`; widgets read cached JSON. Update frequency per widget:

| Widget | Update frequency | Rationale |
|--------|------------------|------------|
| **Day** | Every second | Shows passed/left time with seconds |
| **Month** | Every day (midnight) | Values change daily |
| **Year** | Every day (midnight) | Values change daily |
| **Hour calculation** | Every second when running, else 1 min | Stopwatch needs per-second tick |
| **Daily tasks** | On task change + 1 min fallback | Event-driven; minute keeps day time in sync |
| **Counter** | On tap + on app sync | Event-driven; fallback when app opens |
| **Countdown** | Every day (midnight) | Days left change at midnight |

**iOS:** Timeline policy per provider (DayWidgetProvider, MonthYearWidgetProvider, etc.).  
**Android:** DayWidgetTickWorker (1s), StopwatchTickWorker (1s when running), DailyMidnightWorker (midnight), WorkManager (15 min fallback).

**Stale cache fallback (Android):** When app hasn't run today, month/year widgets recompute from `Calendar` so display stays correct.

---

## Android Floating Overlay (Dynamic Island–like)

Android-only floating pill that appears over other apps. Similar to iOS Dynamic Island.

- **Location:** Widgets screen → Floating overlay
- **Permission:** "Display over other apps" (SYSTEM_ALERT_WINDOW)
- **Data:** Reads from MMKV (same as widgets) – `widget.cache`, `daily.tasks.widget`, `hour.calculation.widget`, `overlay.widgetType`
- **Behavior:** Tap pill to expand, tap expanded to open app, long-press pill to open app, drag to move
- **Update:** Every 1 second (same as day widget)

---

## Quick Reference

| Platform | Data source | Update mechanism |
|----------|-------------|------------------|
| iOS | UserDefaults (App Group) | TimelineProvider per widget type |
| Android | MMKV | WorkManager 15 min + per-widget tick workers |
| Android overlay | MMKV | UNTILOverlayService every 1s |

| Constant | Value |
|----------|-------|
| App Group ID | `group.com.until.app` |
| Cache key | `widget.cache` |
| MMKV instance | `until-storage` |
