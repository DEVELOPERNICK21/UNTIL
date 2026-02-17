# Android Widget Implementation Reference

Complete implementation for Android App Widgets (Year, Month, Day progress widgets). Copy and adapt for your project.

---

## 1. Project Structure

```
android/
├── app/src/main/
│   ├── java/com/yourpackage/
│   │   ├── YearProgressWidgetProvider.kt
│   │   ├── MonthProgressWidgetProvider.kt
│   │   └── DayProgressWidgetProvider.kt
│   ├── res/
│   │   ├── drawable/
│   │   │   ├── widget_background.xml
│   │   │   └── widget_progress_bar_colored.xml
│   │   ├── layout/
│   │   │   ├── widget_year_progress.xml
│   │   │   ├── widget_month_progress.xml
│   │   │   └── widget_day_progress.xml
│   │   ├── values/
│   │   │   └── strings.xml (widget strings)
│   │   └── xml/
│   │       ├── widget_calendar_info.xml
│   │       ├── widget_month_info.xml
│   │       └── widget_day_info.xml
│   └── AndroidManifest.xml
```

---

## 2. AppWidgetProvider Classes (Kotlin)

### YearProgressWidgetProvider.kt

```kotlin
package com.yourpackage

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.widget.RemoteViews
import java.util.Calendar

class YearProgressWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val calendar = Calendar.getInstance()
        val dayOfYear = calendar.get(Calendar.DAY_OF_YEAR)
        val totalDaysInYear = calendar.getActualMaximum(Calendar.DAY_OF_YEAR)
        val daysPassed = dayOfYear
        val daysLeft = totalDaysInYear - daysPassed
        val percentage = (daysPassed.toDouble() / totalDaysInYear) * 100

        val views = RemoteViews(context.packageName, R.layout.widget_year_progress).apply {
            setTextViewText(R.id.widget_days_passed_value, context.getString(R.string.widget_days_passed_format, daysPassed))
            setTextViewText(R.id.widget_days_left_value, context.getString(R.string.widget_days_left_format, daysLeft))
            setTextViewText(R.id.widget_percentage, context.getString(R.string.widget_percentage_value, percentage))

            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val rootPendingIntent = PendingIntent.getActivity(
                context, 0, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            setOnClickPendingIntent(R.id.widget_root, rootPendingIntent)

            setOnClickPendingIntent(R.id.widget_days_passed_value, PendingIntent.getActivity(
                context, 200,
                Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("widget_action", "days_passed")
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))
            setOnClickPendingIntent(R.id.widget_days_left_value, PendingIntent.getActivity(
                context, 201,
                Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("widget_action", "days_left")
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))
            setOnClickPendingIntent(R.id.widget_percentage, PendingIntent.getActivity(
                context, 202,
                Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("widget_action", "percentage")
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))

            val yearDotsBitmap = createYearDotsBitmap(dayOfYear, totalDaysInYear)
            setImageViewBitmap(R.id.widget_year_dots, yearDotsBitmap)
            yearDotsBitmap.recycle()
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun createYearDotsBitmap(dayOfYear: Int, totalDaysInYear: Int): Bitmap {
        val cols = 25
        val rows = 15
        val cellWidthPx = 45
        val cellHeightPx = 70
        val dotRadiusPx = 18f
        val bitmapWidth = cols * cellWidthPx
        val bitmapHeight = rows * cellHeightPx
        val bitmap = Bitmap.createBitmap(bitmapWidth, bitmapHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.TRANSPARENT)

        val passedPaint = Paint().apply {
            color = 0xFFBB86FC.toInt()
            isAntiAlias = true
            style = Paint.Style.FILL
        }
        val pendingPaint = Paint().apply {
            color = 0xFF333333.toInt()
            isAntiAlias = true
            style = Paint.Style.FILL
        }

        val totalDots = 365
        for (dayIndex in 0 until totalDots) {
            val day = dayIndex + 1
            val col = dayIndex % cols
            val row = dayIndex / cols
            val cx = col * cellWidthPx + cellWidthPx / 2f
            val cy = row * cellHeightPx + cellHeightPx / 2f
            val paint = if (day <= dayOfYear) passedPaint else pendingPaint
            canvas.drawCircle(cx, cy, dotRadiusPx, paint)
        }

        return bitmap
    }
}
```

### MonthProgressWidgetProvider.kt

```kotlin
package com.yourpackage

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.widget.RemoteViews
import java.util.Calendar

class MonthProgressWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val calendar = Calendar.getInstance()
        val dayOfMonth = calendar.get(Calendar.DAY_OF_MONTH)
        val totalDaysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH)
        val daysPassed = dayOfMonth
        val daysLeft = totalDaysInMonth - daysPassed
        val percentage = (daysPassed.toDouble() / totalDaysInMonth) * 100
        val progressPercent = percentage.toInt().coerceIn(0, 100)

        val views = RemoteViews(context.packageName, R.layout.widget_month_progress).apply {
            setProgressBar(R.id.widget_month_progress_bar, 100, progressPercent, false)
            setTextViewText(R.id.widget_days_passed_value, context.getString(R.string.widget_days_passed_format, daysPassed))
            setTextViewText(R.id.widget_days_left_value, context.getString(R.string.widget_days_left_format, daysLeft))
            setTextViewText(R.id.widget_percentage, context.getString(R.string.widget_percentage_value, percentage))

            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(
                context, 0, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))
            setOnClickPendingIntent(R.id.widget_days_passed_value, PendingIntent.getActivity(
                context, 300,
                Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("widget_action", "month_days_passed")
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))
            setOnClickPendingIntent(R.id.widget_days_left_value, PendingIntent.getActivity(
                context, 301,
                Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("widget_action", "month_days_left")
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))
            setOnClickPendingIntent(R.id.widget_percentage, PendingIntent.getActivity(
                context, 302,
                Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("widget_action", "month_percentage")
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))

            val monthDotsBitmap = createMonthDotsBitmap(dayOfMonth, totalDaysInMonth)
            setImageViewBitmap(R.id.widget_month_dots, monthDotsBitmap)
            monthDotsBitmap.recycle()
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun createMonthDotsBitmap(dayOfMonth: Int, totalDaysInMonth: Int): Bitmap {
        val cols = 7
        val rows = if (totalDaysInMonth <= 28) 4 else if (totalDaysInMonth <= 35) 5 else 6
        val cellWidthPx = 50
        val cellHeightPx = 50
        val dotRadiusPx = 20f
        val bitmapWidth = cols * cellWidthPx
        val bitmapHeight = rows * cellHeightPx
        val bitmap = Bitmap.createBitmap(bitmapWidth, bitmapHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.TRANSPARENT)

        val passedPaint = Paint().apply {
            color = 0xFFBB86FC.toInt()
            isAntiAlias = true
            style = Paint.Style.FILL
        }
        val pendingPaint = Paint().apply {
            color = 0xFF333333.toInt()
            isAntiAlias = true
            style = Paint.Style.FILL
        }

        for (dayIndex in 0 until totalDaysInMonth) {
            val day = dayIndex + 1
            val col = dayIndex % cols
            val row = dayIndex / cols
            val cx = col * cellWidthPx + cellWidthPx / 2f
            val cy = row * cellHeightPx + cellHeightPx / 2f
            val paint = if (day <= dayOfMonth) passedPaint else pendingPaint
            canvas.drawCircle(cx, cy, dotRadiusPx, paint)
        }

        return bitmap
    }
}
```

### DayProgressWidgetProvider.kt

```kotlin
package com.yourpackage

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.widget.RemoteViews
import java.util.Calendar

class DayProgressWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val calendar = Calendar.getInstance()
        val hourOfDay = calendar.get(Calendar.HOUR_OF_DAY)
        val minuteOfHour = calendar.get(Calendar.MINUTE)
        val totalMinutesInDay = 24 * 60
        val minutesPassed = hourOfDay * 60 + minuteOfHour
        val minutesLeft = totalMinutesInDay - minutesPassed
        val percentage = (minutesPassed.toDouble() / totalMinutesInDay) * 100
        val hoursPassed = minutesPassed / 60
        val hoursLeft = minutesLeft / 60
        val progressPercent = percentage.toInt().coerceIn(0, 100)

        val views = RemoteViews(context.packageName, R.layout.widget_day_progress).apply {
            setProgressBar(R.id.widget_day_progress_bar, 100, progressPercent, false)
            setTextViewText(R.id.widget_hours_passed_value, context.getString(R.string.widget_hours_passed_format, hoursPassed))
            setTextViewText(R.id.widget_hours_left_value, context.getString(R.string.widget_hours_left_format, hoursLeft))
            setTextViewText(R.id.widget_percentage, context.getString(R.string.widget_percentage_value, percentage))

            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(
                context, 0, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))
            setOnClickPendingIntent(R.id.widget_hours_passed_value, PendingIntent.getActivity(
                context, 400,
                Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("widget_action", "day_hours_passed")
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))
            setOnClickPendingIntent(R.id.widget_hours_left_value, PendingIntent.getActivity(
                context, 401,
                Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("widget_action", "day_hours_left")
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))
            setOnClickPendingIntent(R.id.widget_percentage, PendingIntent.getActivity(
                context, 402,
                Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("widget_action", "day_percentage")
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))

            val dayDotsBitmap = createDayDotsBitmap(hourOfDay)
            setImageViewBitmap(R.id.widget_day_dots, dayDotsBitmap)
            dayDotsBitmap.recycle()
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun createDayDotsBitmap(hourOfDay: Int): Bitmap {
        val cols = 6
        val rows = 4
        val cellWidthPx = 50
        val cellHeightPx = 50
        val dotRadiusPx = 20f
        val bitmapWidth = cols * cellWidthPx
        val bitmapHeight = rows * cellHeightPx
        val bitmap = Bitmap.createBitmap(bitmapWidth, bitmapHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.TRANSPARENT)

        val passedPaint = Paint().apply {
            color = 0xFFBB86FC.toInt()
            isAntiAlias = true
            style = Paint.Style.FILL
        }
        val pendingPaint = Paint().apply {
            color = 0xFF333333.toInt()
            isAntiAlias = true
            style = Paint.Style.FILL
        }

        for (hourIndex in 0 until 24) {
            val col = hourIndex % cols
            val row = hourIndex / cols
            val cx = col * cellWidthPx + cellWidthPx / 2f
            val cy = row * cellHeightPx + cellHeightPx / 2f
            val paint = if (hourIndex < hourOfDay) passedPaint else pendingPaint
            canvas.drawCircle(cx, cy, dotRadiusPx, paint)
        }

        return bitmap
    }
}
```

---

## 3. Layouts (res/layout/)

### widget_year_progress.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="12dp"
    android:background="@drawable/widget_background">
    <ImageView
        android:id="@+id/widget_year_dots"
        android:layout_width="match_parent"
        android:layout_height="340dp"
        android:layout_marginTop="4dp"
        android:layout_marginBottom="6dp"
        android:scaleType="fitCenter"
        android:contentDescription="@null" />
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:gravity="center_horizontal">
        <LinearLayout
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:orientation="horizontal"
            android:gravity="center">
            <TextView
                android:id="@+id/widget_days_passed_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:textSize="20sp"
                android:textStyle="bold"
                android:textColor="#FFFFFF"
                android:letterSpacing="0.02" />
            <TextView
                android:id="@+id/widget_days_left_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginStart="16dp"
                android:textSize="20sp"
                android:textStyle="bold"
                android:textColor="#BB86FC"
                android:letterSpacing="0.02" />
        </LinearLayout>
        <TextView
            android:id="@+id/widget_percentage"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="6dp"
            android:textSize="26sp"
            android:textStyle="bold"
            android:textColor="#BB86FC"
            android:letterSpacing="0.03"
            android:gravity="center" />
        <TextView
            android:id="@+id/widget_percentage_subtitle"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="2dp"
            android:text="@string/widget_subtitle_percentage"
            android:textSize="13sp"
            android:textColor="#808080"
            android:gravity="center" />
    </LinearLayout>
</LinearLayout>
```

### widget_month_progress.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="12dp"
    android:background="@drawable/widget_background">
    <ImageView
        android:id="@+id/widget_month_dots"
        android:layout_width="match_parent"
        android:layout_height="280dp"
        android:layout_marginTop="4dp"
        android:layout_marginBottom="6dp"
        android:scaleType="fitCenter"
        android:contentDescription="@null" />
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:gravity="center_horizontal">
        <ProgressBar
            android:id="@+id/widget_month_progress_bar"
            style="?android:attr/progressBarStyleHorizontal"
            android:layout_width="match_parent"
            android:layout_height="10dp"
            android:layout_marginTop="4dp"
            android:layout_marginBottom="8dp"
            android:progressDrawable="@drawable/widget_progress_bar_colored"
            android:max="100"
            android:progress="0" />
        <LinearLayout
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:orientation="horizontal"
            android:gravity="center">
            <TextView
                android:id="@+id/widget_days_passed_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:textSize="20sp"
                android:textStyle="bold"
                android:textColor="#FF4444"
                android:letterSpacing="0.02" />
            <TextView
                android:id="@+id/widget_days_left_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginStart="16dp"
                android:textSize="20sp"
                android:textStyle="bold"
                android:textColor="#4CAF50"
                android:letterSpacing="0.02" />
        </LinearLayout>
        <TextView
            android:id="@+id/widget_percentage"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="6dp"
            android:textSize="26sp"
            android:textStyle="bold"
            android:textColor="#BB86FC"
            android:letterSpacing="0.03"
            android:gravity="center" />
        <TextView
            android:id="@+id/widget_percentage_subtitle"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="2dp"
            android:text="@string/widget_subtitle_percentage_month"
            android:textSize="13sp"
            android:textColor="#808080"
            android:gravity="center" />
    </LinearLayout>
</LinearLayout>
```

### widget_day_progress.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="12dp"
    android:background="@drawable/widget_background">
    <ImageView
        android:id="@+id/widget_day_dots"
        android:layout_width="match_parent"
        android:layout_height="200dp"
        android:layout_marginTop="4dp"
        android:layout_marginBottom="6dp"
        android:scaleType="fitCenter"
        android:contentDescription="@null" />
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:gravity="center_horizontal">
        <ProgressBar
            android:id="@+id/widget_day_progress_bar"
            style="?android:attr/progressBarStyleHorizontal"
            android:layout_width="match_parent"
            android:layout_height="10dp"
            android:layout_marginTop="4dp"
            android:layout_marginBottom="8dp"
            android:progressDrawable="@drawable/widget_progress_bar_colored"
            android:max="100"
            android:progress="0" />
        <LinearLayout
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:orientation="horizontal"
            android:gravity="center">
            <TextView
                android:id="@+id/widget_hours_passed_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:textSize="20sp"
                android:textStyle="bold"
                android:textColor="#FF4444"
                android:letterSpacing="0.02" />
            <TextView
                android:id="@+id/widget_hours_left_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginStart="16dp"
                android:textSize="20sp"
                android:textStyle="bold"
                android:textColor="#4CAF50"
                android:letterSpacing="0.02" />
        </LinearLayout>
        <TextView
            android:id="@+id/widget_percentage"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="6dp"
            android:textSize="26sp"
            android:textStyle="bold"
            android:textColor="#BB86FC"
            android:letterSpacing="0.03"
            android:gravity="center" />
        <TextView
            android:id="@+id/widget_percentage_subtitle"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="2dp"
            android:text="@string/widget_subtitle_percentage_day"
            android:textSize="13sp"
            android:textColor="#808080"
            android:gravity="center" />
    </LinearLayout>
</LinearLayout>
```

---

## 4. Drawables (res/drawable/)

### widget_background.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#000000" />
    <corners android:radius="12dp" />
</shape>
```

### widget_progress_bar_colored.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:id="@android:id/background">
        <shape android:shape="rectangle">
            <corners android:radius="6dp" />
            <solid android:color="#4CAF50" />
        </shape>
    </item>
    <item android:id="@android:id/progress">
        <clip>
            <shape android:shape="rectangle">
                <corners android:radius="6dp" />
                <solid android:color="#FF4444" />
            </shape>
        </clip>
    </item>
</layer-list>
```

---

## 5. Widget Metadata (res/xml/)

### widget_calendar_info.xml (Year widget)

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="380dp"
    android:targetCellWidth="3"
    android:targetCellHeight="5"
    android:initialLayout="@layout/widget_year_progress"
    android:updatePeriodMillis="86400000"
    android:widgetCategory="home_screen"
    android:resizeMode="horizontal|vertical"
    android:description="@string/widget_year_progress_description" />
```

### widget_month_info.xml (Month widget)

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="320dp"
    android:targetCellWidth="3"
    android:targetCellHeight="4"
    android:initialLayout="@layout/widget_month_progress"
    android:updatePeriodMillis="3600000"
    android:resizeMode="horizontal|vertical"
    android:description="@string/widget_month_progress_description" />
```

### widget_day_info.xml (Day widget)

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="240dp"
    android:targetCellWidth="3"
    android:targetCellHeight="3"
    android:initialLayout="@layout/widget_day_progress"
    android:updatePeriodMillis="60000"
    android:resizeMode="horizontal|vertical"
    android:description="@string/widget_day_progress_description" />
```

**Note:** `updatePeriodMillis` is limited by the system; minimum is ~15 minutes. Use `AlarmManager` or `WorkManager` for more frequent updates.

---

## 6. Strings (res/values/strings.xml)

Add these to your strings.xml:

```xml
<string name="widget_year_progress_description">Your year, your accountability: days passed, intention, what\'s left.</string>
<string name="widget_month_progress_description">Your month, your accountability: days passed, intention, what\'s left.</string>
<string name="widget_day_progress_description">Today: hours passed, intention, what\'s left.</string>
<string name="widget_days_passed_format">%dd passed</string>
<string name="widget_days_left_format">%dd Left</string>
<string name="widget_hours_passed_format">%dh passed</string>
<string name="widget_hours_left_format">%dh Left</string>
<string name="widget_subtitle_percentage">your year</string>
<string name="widget_subtitle_percentage_month">your month</string>
<string name="widget_subtitle_percentage_day">today</string>
<string name="widget_percentage_value">%.1f%%</string>
```

---

## 7. AndroidManifest.xml

Add inside `<application>`:

```xml
<!-- Year progress widget -->
<receiver
    android:name=".YearProgressWidgetProvider"
    android:exported="true"
    android:label="@string/widget_year_progress_description">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_calendar_info" />
</receiver>

<!-- Month progress widget -->
<receiver
    android:name=".MonthProgressWidgetProvider"
    android:exported="true"
    android:label="@string/widget_month_progress_description">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_month_info" />
</receiver>

<!-- Day progress widget -->
<receiver
    android:name=".DayProgressWidgetProvider"
    android:exported="true"
    android:label="@string/widget_day_progress_description">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_day_info" />
</receiver>
```

---

## 8. Porting Checklist

1. **Change package** – Replace `com.wallpe` or `com.yourpackage` with your app package in all Kotlin files.
2. **MainActivity** – Ensure `MainActivity::class.java` is your launcher activity; update if different.
3. **widget_action** – Handle `widget_action` intent extras in your launcher activity for deep links.
4. **Colors** – Customize `0xFFBB86FC` (purple), `0xFF333333` (gray), `#FF4444`, `#4CAF50`, etc. to match your app theme.
5. **updatePeriodMillis** – Android may limit updates; use `AlarmManager`/`WorkManager` for sub-15-minute updates.

---

## 9. Summary

| Widget | Layout                | Provider                    | Update Interval  |
| ------ | --------------------- | --------------------------- | ---------------- |
| Year   | widget_year_progress  | YearProgressWidgetProvider  | 24h (86400000ms) |
| Month  | widget_month_progress | MonthProgressWidgetProvider | 1h (3600000ms)   |
| Day    | widget_day_progress   | DayProgressWidgetProvider   | 1min (60000ms)   |

---

## 10. UNTIL Implementation vs This Reference

This section documents how the **UNTIL** app’s Android widgets differ from the reference above and what was adopted for correctness and robustness.

### Architecture: Cache as single source of truth

- **Reference:** Each provider computes values from `Calendar` in `onUpdate` (device-local time only). No app state.
- **UNTIL:** Progress is **app-defined** (birth date, death age, time logic in JS). The React Native app writes a **widget cache** (JSON) to MMKV; a single **`UNTILWidgetWorker`** (WorkManager) reads that cache and updates **all** widget instances (day, month, year). Providers are thin: they call `UNTILWidgetWorker.updateWidgets(context)` and `UNTILWidgetWorker.schedule(context)`.
- **Why:** UNTIL must show the same numbers as the in-app “until” logic. Duplicating time logic in Kotlin would drift from the app and break consistency. One source of truth (JS + `WidgetSync`) → one cache → one update path.

### What UNTIL adopted from this reference

1. **Tap-to-open**
   - Root of each widget layout has `android:id="@+id/widget_root"`.
   - `setOnClickPendingIntent(R.id.widget_root, openAppPendingIntent(...))` opens `MainActivity` when the user taps the widget.
   - PendingIntent uses `FLAG_IMMUTABLE` (required on Android 12+) and distinct request codes per widget type so the system does not collapse intents across different widgets.

2. **Drawable background**
   - `res/drawable/widget_background.xml` (shape, color `#0E0E10`, 12dp corners) is used for all three widget layouts instead of inline `android:background="#0E0E10"`. Single place to change theme and shape.

3. **String resources**
   - Widget text uses `context.getString(R.string.widget_*_format, ...)` so labels live in `res/values/strings.xml`. Enables future localization and keeps wording consistent.

4. **Bitmap lifecycle**
   - Reference recycles the year-dots bitmap after `setImageViewBitmap`. UNTIL does **not** recycle it: `RemoteViews` may copy the bitmap asynchronously to the host process; recycling too early can cause a blank image or crash. Comment in code documents this.

### What UNTIL did not adopt (and why)

- **Per-provider `Calendar` logic:** Would duplicate app logic and diverge from the in-app “until” values; UNTIL keeps one source (cache).
- **Per-element PendingIntents** (e.g. “days passed” opening a specific screen): Can be added later with `widget_action` intent extras and handling in the app; for now only root tap opens the app.
- **`updatePeriodMillis` as primary updater:** Android throttles it (e.g. ~15 min minimum). UNTIL uses WorkManager (e.g. 30 min) plus immediate updates when the app comes to foreground (`WidgetSync` + `updateWidgets`), so widgets stay in sync with app-authored data.
