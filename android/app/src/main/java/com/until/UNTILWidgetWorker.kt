package com.until

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.tencent.mmkv.MMKV
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Color


private const val WIDGET_CACHE_KEY = "widget.cache"
private const val MMKV_ID = "until-storage"
private const val WORK_NAME = "UNTILWidgetUpdate"

/** Request codes for widget tap PendingIntents; distinct to avoid reuse across types. */
private const val PENDING_INTENT_DAY = 100
private const val PENDING_INTENT_MONTH = 101
private const val PENDING_INTENT_YEAR = 102

class UNTILWidgetWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        updateWidgets(applicationContext)
        return Result.success()
    }

    companion object {
        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<UNTILWidgetWorker>(30, TimeUnit.MINUTES)
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }

        private val defaultCache = WidgetCache(
            dayPercentDone = 0, dayPercentLeft = 100,
            monthDaysPassed = 0, monthDaysLeft = 31, monthPercent = 0,
            yearDaysPassed = 0, yearDaysLeft = 365, yearPercent = 0,
            dayProgress = 0.0, monthProgress = 0.0, yearProgress = 0.0
        )

        fun updateWidgets(context: Context) {
            val cache = loadWidgetCache(context) ?: defaultCache
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val providers = arrayOf(
                ComponentName(context, UNTILDayWidgetProvider::class.java),
                ComponentName(context, UNTILMonthWidgetProvider::class.java),
                ComponentName(context, UNTILYearWidgetProvider::class.java)
            )
            val ids = providers.flatMap { appWidgetManager.getAppWidgetIds(it).toList() }.distinct()
            if (ids.isEmpty()) return

            for (id in ids) {
                val widgetInfo = appWidgetManager.getAppWidgetInfo(id)
                val providerClass = widgetInfo?.provider?.className ?: ""
                val layoutId = when {
                    providerClass.endsWith("UNTILDayWidgetProvider") -> R.layout.widget_day
                    providerClass.endsWith("UNTILMonthWidgetProvider") -> R.layout.widget_month
                    providerClass.endsWith("UNTILYearWidgetProvider") -> R.layout.widget_year
                    else -> R.layout.widget_day
                }
                try {
                    val views = buildRemoteViews(context, layoutId, cache)
                    appWidgetManager.updateAppWidget(id, views)
                } catch (e: Exception) {
                    // Still push an update so the widget doesn't stay on "Loading"
                    val views = buildRemoteViews(context, layoutId, defaultCache)
                    appWidgetManager.updateAppWidget(id, views)
                }
            }
        }

        private fun loadWidgetCache(context: Context): WidgetCache? {
            return try {
                // MMKV should already be initialized in MainApplication.onCreate(),
                // but initialize() is safe to call multiple times (idempotent)
                MMKV.initialize(context)
                val mmkv = MMKV.mmkvWithID(MMKV_ID)
                val json = mmkv?.decodeString(WIDGET_CACHE_KEY) ?: return null
                parseCache(json)
            } catch (e: Exception) {
                null
            }
        }

        private fun parseCache(json: String): WidgetCache? {
            return try {
                val obj = JSONObject(json)
                WidgetCache(
                    dayPercentDone = obj.optInt("dayPercentDone", 0),
                    dayPercentLeft = obj.optInt("dayPercentLeft", 0),
                    monthDaysPassed = obj.optInt("monthDaysPassed", 0),
                    monthDaysLeft = obj.optInt("monthDaysLeft", 0),
                    monthPercent = obj.optInt("monthPercent", 0),
                    yearDaysPassed = obj.optInt("yearDaysPassed", 0),
                    yearDaysLeft = obj.optInt("yearDaysLeft", 0),
                    yearPercent = obj.optInt("yearPercent", 0),
                    dayProgress = obj.optDouble("dayProgress", 0.0),
                    monthProgress = obj.optDouble("monthProgress", 0.0),
                    yearProgress = obj.optDouble("yearProgress", 0.0)
                )
            } catch (e: Exception) {
                null
            }
        }


        /**
         * PendingIntent to open the app when the user taps the widget.
         * Uses distinct request codes per widget type so the system doesn't collapse different widgets' intents.
         */
        private fun openAppPendingIntent(context: Context, layoutId: Int): PendingIntent {
            val requestCode = when (layoutId) {
                R.layout.widget_day -> PENDING_INTENT_DAY
                R.layout.widget_month -> PENDING_INTENT_MONTH
                R.layout.widget_year -> PENDING_INTENT_YEAR
                else -> PENDING_INTENT_DAY
            }
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            return PendingIntent.getActivity(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        private fun buildRemoteViews(context: Context, layoutId: Int, cache: WidgetCache): RemoteViews {
            val views = RemoteViews(context.packageName, layoutId)
            try {
                when (layoutId) {
                    R.layout.widget_day -> {
                        val dDone = cache.dayPercentDone.coerceIn(0, 100)
                        val dLeft = cache.dayPercentLeft.coerceIn(0, 100)
                        val dProgress = cache.dayProgress.coerceIn(0.0, 1.0)
                        views.setTextViewText(R.id.widget_day_done, context.getString(R.string.widget_day_done_format, dDone))
                        views.setTextViewText(R.id.widget_day_left, context.getString(R.string.widget_day_left_format, dLeft))
                        try {
                            val dotsBitmap = createDayDotsBitmap(context, dProgress)
                            if (dotsBitmap != null && !dotsBitmap.isRecycled) {
                                views.setImageViewBitmap(R.id.widget_day_dots, dotsBitmap)
                            }
                        } catch (e: Exception) {
                            // Dots optional; text already set so widget still shows data
                        }
                    }
                    R.layout.widget_month -> {
                        val mPassed = cache.monthDaysPassed.coerceIn(0, 31)
                        val mLeft = cache.monthDaysLeft.coerceIn(0, 31)
                        val mPct = cache.monthPercent.coerceIn(0, 100)
                        val mProgress = cache.monthProgress.coerceIn(0.0, 1.0)
                        views.setTextViewText(R.id.widget_month_passed, context.getString(R.string.widget_month_passed_format, mPassed))
                        views.setTextViewText(R.id.widget_month_left, context.getString(R.string.widget_month_left_format, mLeft))
                        views.setTextViewText(R.id.widget_month_percent, context.getString(R.string.widget_month_percent_format, mPct))
                        // Month progress bar (keep day widget as circular only)
                        views.setProgressBar(R.id.widget_month_progress, 100, (mProgress * 100).toInt().coerceIn(0, 100), false)
                        try {
                            val dotsBitmap = createMonthDotsBitmap(context, mProgress)
                            if (dotsBitmap != null && !dotsBitmap.isRecycled) {
                                views.setImageViewBitmap(R.id.widget_month_dots, dotsBitmap)
                            }
                        } catch (e: Exception) {
                            // Dots optional; text already set so widget still shows data
                        }
                    }
                    R.layout.widget_year -> {
                        val yearPassed = cache.yearDaysPassed.coerceIn(0, 365)
                        val yearLeft = cache.yearDaysLeft.coerceIn(0, 365)
                        val yearPct = cache.yearPercent.coerceIn(0, 100)
                        val yearProgressClamped = cache.yearProgress.coerceIn(0.0, 1.0)
                        views.setTextViewText(R.id.widget_year_passed, context.getString(R.string.widget_year_passed_format, yearPassed))
                        views.setTextViewText(R.id.widget_year_left, context.getString(R.string.widget_year_left_format, yearLeft))
                        views.setTextViewText(R.id.widget_year_percent, context.getString(R.string.widget_year_percent_format, yearPct))
                        views.setProgressBar(R.id.widget_year_progress, 100, (yearProgressClamped * 100).toInt().coerceIn(0, 100), false)
                        try {
                            val dotsBitmap = createYearDotsBitmap(context, yearProgressClamped, yearPassed)
                            if (dotsBitmap != null && !dotsBitmap.isRecycled) {
                                views.setImageViewBitmap(R.id.widget_year_dots, dotsBitmap)
                            }
                        } catch (e: Exception) {
                            // Dots optional; text/progress already set so widget still shows data
                        }
                    }
                }
                views.setOnClickPendingIntent(R.id.widget_root, openAppPendingIntent(context, layoutId))
            } catch (e: Exception) {
                // If anything fails, at least set the click intent so widget is interactive
                try {
                    views.setOnClickPendingIntent(R.id.widget_root, openAppPendingIntent(context, layoutId))
                } catch (e2: Exception) {
                    // Ignore
                }
            }
            return views
        }


        /** Day dots: 24 dots (one per hour). Purple = passed, Orange = current, Gray = remaining */
        private fun createDayDotsBitmap(context: Context, dayProgress: Double): Bitmap? {
            return try {
                val clamped = dayProgress.coerceIn(0.0, 1.0)
                val totalDots = 24

                // Fixed bitmap size (px). RemoteViews will scale via ImageView scaleType.
                val sizePx = 260
                val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bitmap)

                val center = sizePx / 2f
                val stroke = 14f
                val ringRadius = center - stroke - 8f

                val remainingPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    style = Paint.Style.STROKE
                    strokeWidth = stroke
                    strokeCap = Paint.Cap.ROUND
                    color = Color.parseColor("#444444")
                }
                val passedPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    style = Paint.Style.STROKE
                    strokeWidth = stroke
                    strokeCap = Paint.Cap.ROUND
                    color = Color.parseColor("#BB86FC")
                }
                val currentPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    style = Paint.Style.FILL
                    color = Color.parseColor("#E87C20")
                }
                val dotPassedPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    style = Paint.Style.FILL
                    color = Color.parseColor("#BB86FC")
                }
                val dotRemainingPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    style = Paint.Style.FILL
                    color = Color.parseColor("#666666")
                }

                // Background ring
                canvas.drawCircle(center, center, ringRadius, remainingPaint)

                // Progress ring (start at top)
                val oval = android.graphics.RectF(
                    center - ringRadius,
                    center - ringRadius,
                    center + ringRadius,
                    center + ringRadius
                )
                // drawArc expects Float sweep angle
                val sweep = (clamped * 360.0).toFloat()
                canvas.drawArc(oval, -90f, sweep, false, passedPaint)

                // 24 hour dots around the ring
                val passedHours = (clamped * totalDots).toInt().coerceIn(0, totalDots)
                val hasCurrentHour = passedHours < totalDots && clamped < 1.0
                val currentHour = if (hasCurrentHour) passedHours else -1

                val dotRadius = 4.2f
                val currentDotRadius = dotRadius * 1.6f
                val dotRingRadius = ringRadius + stroke / 2f + 6f
                val stepDeg = 360f / totalDots

                for (i in 0 until totalDots) {
                    val angleDeg = -90f + (i * stepDeg)
                    val angleRad = Math.toRadians(angleDeg.toDouble())
                    val cx = (center + dotRingRadius * Math.cos(angleRad)).toFloat()
                    val cy = (center + dotRingRadius * Math.sin(angleRad)).toFloat()

                    when {
                        i < passedHours -> canvas.drawCircle(cx, cy, dotRadius, dotPassedPaint)
                        i == currentHour && currentHour >= 0 -> canvas.drawCircle(cx, cy, currentDotRadius, currentPaint)
                        else -> canvas.drawCircle(cx, cy, dotRadius, dotRemainingPaint)
                    }
                }

                // Orange knob at current progress end (optional, makes ring feel interactive)
                if (clamped in 0.0..0.999999) {
                    val knobAngleDeg = -90f + sweep
                    val knobAngleRad = Math.toRadians(knobAngleDeg.toDouble())
                    val kx = (center + ringRadius * Math.cos(knobAngleRad)).toFloat()
                    val ky = (center + ringRadius * Math.sin(knobAngleRad)).toFloat()
                    canvas.drawCircle(kx, ky, 6.5f, currentPaint)
                }

                bitmap
            } catch (e: Exception) {
                null
            }
        }

        /** Month dots: 12 dots (one per month). Purple = passed, Orange = current, Gray = remaining */
        private fun createMonthDotsBitmap(context: Context, monthProgress: Double): Bitmap? {
            return try {
                val totalDots = 12
                val cols = 6
                val rows = 2
                // Render at a larger fixed resolution so the ImageView doesn't need to upscale (prevents blur).
                // The layout uses centerInside, so this bitmap will typically be downscaled slightly (sharp).
                val bitmapWidth = 420
                val bitmapHeight = 140
                val bitmap = Bitmap.createBitmap(bitmapWidth, bitmapHeight, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bitmap)

                val passedPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.parseColor("#BB86FC")
                }
                val currentPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.parseColor("#E87C20")
                }
                val remainingPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.parseColor("#666666")
                }

                val passedMonths = (monthProgress * totalDots).toInt().coerceIn(0, totalDots)
                // Current month is the one we're currently in (only if not all months passed)
                val hasCurrentMonth = passedMonths < totalDots && monthProgress < 1.0
                val currentMonth = if (hasCurrentMonth) passedMonths else -1

                val cellW = bitmapWidth / cols.toFloat()
                val cellH = bitmapHeight / rows.toFloat()
                val radius = 5.2f
                val currentRadius = radius * 1.6f

                for (i in 0 until totalDots) {
                    val col = i % cols
                    val row = i / cols
                    val cx = col * cellW + cellW / 2f
                    val cy = row * cellH + cellH / 2f
                    
                    when {
                        i < passedMonths -> {
                            canvas.drawCircle(cx, cy, radius, passedPaint)
                        }
                        i == currentMonth && currentMonth >= 0 -> {
                            // Draw current dot slightly larger for interactivity
                            canvas.drawCircle(cx, cy, currentRadius, currentPaint)
                        }
                        else -> {
                            canvas.drawCircle(cx, cy, radius, remainingPaint)
                        }
                    }
                }
                bitmap
            } catch (e: Exception) {
                null
            }
        }

        /** Year dots: 365 dots. Purple = passed, Orange = current day, Gray = remaining */
        private fun createYearDotsBitmap(context: Context, yearProgress: Double, yearDaysPassed: Int): Bitmap? {
            return try {
                val cols = 25
                val totalDots = 365
                val rows = Math.ceil(totalDots / cols.toDouble()).toInt()
                val dotSize = 10
                val gap = 6
                val step = (dotSize + gap).toFloat()
                val width = (cols * step).toInt().coerceAtMost(900).coerceAtLeast(1)
                val height = (rows * step).toInt().coerceAtMost(900).coerceAtLeast(1)
                val radius = (dotSize / 2f).coerceAtLeast(1f)
                val currentRadius = radius * 1.3f // Make current dot slightly larger for interactivity

                val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bitmap)

                val passedPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.parseColor("#BB86FC")
                }
                val currentPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.parseColor("#E87C20")
                }
                val remainingPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.parseColor("#666666")
                }

                val passedDots = yearDaysPassed.coerceIn(0, totalDots)
                // Current day is the one we're currently in (only if not all days passed)
                val hasCurrentDay = passedDots < totalDots && yearProgress < 1.0
                val currentDay = if (hasCurrentDay) passedDots else -1

                for (i in 0 until totalDots) {
                    val col = i % cols
                    val row = i / cols
                    val cx = col * step + radius
                    val cy = row * step + radius
                    if (cy + radius > height) break
                    
                    when {
                        i < passedDots -> {
                            canvas.drawCircle(cx, cy, radius, passedPaint)
                        }
                        i == currentDay && currentDay >= 0 -> {
                            // Draw current dot slightly larger for interactivity
                            canvas.drawCircle(cx, cy, currentRadius, currentPaint)
                        }
                        else -> {
                            canvas.drawCircle(cx, cy, radius, remainingPaint)
                        }
                    }
                }
                bitmap
            } catch (e: Exception) {
                null
            }
        }

    }
}

private data class WidgetCache(
    val dayPercentDone: Int,
    val dayPercentLeft: Int,
    val monthDaysPassed: Int,
    val monthDaysLeft: Int,
    val monthPercent: Int,
    val yearDaysPassed: Int,
    val yearDaysLeft: Int,
    val yearPercent: Int,
    val dayProgress: Double,
    val monthProgress: Double,
    val yearProgress: Double
)
