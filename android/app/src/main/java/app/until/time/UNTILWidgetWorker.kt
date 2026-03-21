package app.until.time

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.tencent.mmkv.MMKV
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar
import java.util.concurrent.TimeUnit
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Color


private const val WIDGET_CACHE_KEY = "widget.cache"
private const val CUSTOM_COUNTERS_KEY = "custom.counters"
private const val COUNTDOWNS_KEY = "countdowns"
private const val DAILY_TASKS_WIDGET_KEY = "daily.tasks.widget"
private const val HOUR_CALCULATION_WIDGET_KEY = "hour.calculation.widget"
private const val MMKV_ID = "until-storage"
private const val WORK_NAME = "UNTILWidgetUpdate"
private const val DAY_TICK_WORK_NAME = "UNTILDayWidgetTick"
private const val STOPWATCH_TICK_WORK_NAME = "UNTILStopwatchTick"
private const val DAILY_MIDNIGHT_WORK_NAME = "UNTILDailyMidnight"

/** Request codes for widget tap PendingIntents; distinct to avoid reuse across types. */
private const val PENDING_INTENT_DAY = 100
private const val PENDING_INTENT_MONTH = 101
private const val PENDING_INTENT_YEAR = 102
private const val PENDING_INTENT_COUNTER_BASE = 200
private const val PENDING_INTENT_DAILY_TASKS = 103
private const val PENDING_INTENT_HOUR_CALCULATION = 104
private const val PENDING_INTENT_LIFE = 105

private const val STORAGE_KEY_TRIAL_START_DATE = "trial.startDate"
private const val STORAGE_KEY_PREMIUM_IS_ACTIVE = "premium.isActive"
private const val STORAGE_KEY_LIFE_UNLOCK_UNTIL = "engagement.lifeUnlockUntil"

private const val TRIAL_DURATION_MS = 14L * 24 * 60 * 60 * 1000

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
            val request = PeriodicWorkRequestBuilder<UNTILWidgetWorker>(15, TimeUnit.MINUTES)
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }

        fun scheduleDayTick(context: Context) {
            val request = OneTimeWorkRequestBuilder<DayWidgetTickWorker>()
                .setInitialDelay(1, TimeUnit.SECONDS)
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                DAY_TICK_WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                request
            )
        }

        private val defaultCache = WidgetCache(
            dayPercentDone = 0, dayPercentLeft = 100,
            dayPassedMinutes = null, dayRemainingMinutes = null,
            startOfDay = null, endOfDay = null,
            monthIndex = 1,
            monthDaysPassed = 0, monthDaysLeft = 31, monthPercent = 0,
            yearDaysPassed = 0, yearDaysLeft = 365, yearPercent = 0,
            dayProgress = 0.0, monthProgress = 0.0, yearProgress = 0.0,
            lifeProgress = null,
            remainingDaysLife = null,
            lifePercent = null,
            updatedAt = 0L
        )

        /** Recompute month/year from current date when cache is stale (app hasn't run today). SSOT: core/time in JS; this is a fallback for widget display when app is killed. */
        private fun cacheWithFreshMonthYear(context: Context, cache: WidgetCache): WidgetCache {
            val cal = Calendar.getInstance()
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            val startOfTodayMs = cal.timeInMillis
            if (cache.updatedAt >= startOfTodayMs) return cache
            val now = Calendar.getInstance()
            val dayOfMonth = now.get(Calendar.DAY_OF_MONTH)
            val daysInMonth = now.getActualMaximum(Calendar.DAY_OF_MONTH)
            val monthLeft = daysInMonth - dayOfMonth
            val monthProgress = if (daysInMonth > 0) dayOfMonth.toDouble() / daysInMonth else 0.0
            val dayOfYear = now.get(Calendar.DAY_OF_YEAR)
            val daysInYear = now.getActualMaximum(Calendar.DAY_OF_YEAR)
            val yearLeft = daysInYear - dayOfYear
            val yearProgress = if (daysInYear > 0) dayOfYear.toDouble() / daysInYear else 0.0
            return cache.copy(
                monthIndex = now.get(Calendar.MONTH) + 1,
                monthDaysPassed = dayOfMonth,
                monthDaysLeft = monthLeft,
                monthPercent = (monthProgress * 100).toInt().coerceIn(0, 100),
                monthProgress = monthProgress,
                yearDaysPassed = dayOfYear,
                yearDaysLeft = yearLeft,
                yearPercent = (yearProgress * 100).toInt().coerceIn(0, 100),
                yearProgress = yearProgress
            )
        }

        fun scheduleDailyMidnight(context: Context) {
            val cal = Calendar.getInstance()
            cal.add(Calendar.DAY_OF_MONTH, 1)
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            val delayMs = cal.timeInMillis - System.currentTimeMillis()
            val request = OneTimeWorkRequestBuilder<DailyMidnightWorker>()
                .setInitialDelay(maxOf(1, delayMs), java.util.concurrent.TimeUnit.MILLISECONDS)
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                DAILY_MIDNIGHT_WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                request
            )
        }

        fun updateWidgets(context: Context) {
            val cache = loadWidgetCache(context) ?: defaultCache
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val dayProvider = ComponentName(context, UNTILDayWidgetProvider::class.java)
            val monthProvider = ComponentName(context, UNTILMonthWidgetProvider::class.java)
            val yearProvider = ComponentName(context, UNTILYearWidgetProvider::class.java)
            val lifeProvider = ComponentName(context, UNTILLifeWidgetProvider::class.java)
            val counterProvider = ComponentName(context, UNTILCounterWidgetProvider::class.java)
            val countdownProvider = ComponentName(context, UNTILCountdownWidgetProvider::class.java)
            val dailyTasksProvider = ComponentName(context, UNTILDailyTasksWidgetProvider::class.java)
            val hourCalculationProvider = ComponentName(context, UNTILHourCalculationWidgetProvider::class.java)
            val counters = loadCustomCounters(context)
            val countdowns = loadCountdowns(context)
            val dailyTasksPayload = loadDailyTasksPayload(context)

            val dayIds = appWidgetManager.getAppWidgetIds(dayProvider)
            val lifeIds = appWidgetManager.getAppWidgetIds(lifeProvider)
            val monthYearCache = cacheWithFreshMonthYear(context, cache)
            listOf(
                Triple(dayIds, R.layout.widget_day, cache),
                Triple(appWidgetManager.getAppWidgetIds(monthProvider), R.layout.widget_month, monthYearCache),
                Triple(appWidgetManager.getAppWidgetIds(yearProvider), R.layout.widget_year, monthYearCache),
                Triple(lifeIds, R.layout.widget_life, cache),
            ).forEach { (ids, layoutId, cacheForLayout) ->
                if (ids.isEmpty()) return@forEach
                for (id in ids) {
                    try {
                        val views = buildRemoteViews(context, layoutId, cacheForLayout)
                        appWidgetManager.updateAppWidget(id, views)
                    } catch (e: Exception) {
                        val fallbackCache = if (layoutId == R.layout.widget_month || layoutId == R.layout.widget_year) cacheWithFreshMonthYear(context, defaultCache) else defaultCache
                        val views = buildRemoteViews(context, layoutId, fallbackCache)
                        appWidgetManager.updateAppWidget(id, views)
                    }
                }
            }
            if (dayIds.isNotEmpty()) scheduleDayTick(context)
            if (appWidgetManager.getAppWidgetIds(monthProvider).isNotEmpty() ||
                appWidgetManager.getAppWidgetIds(yearProvider).isNotEmpty() ||
                appWidgetManager.getAppWidgetIds(countdownProvider).isNotEmpty() ||
                appWidgetManager.getAppWidgetIds(lifeProvider).isNotEmpty()) {
                scheduleDailyMidnight(context)
            }

            val counterIds = appWidgetManager.getAppWidgetIds(counterProvider)
            if (counterIds.isNotEmpty()) {
                val firstCounter = counters.firstOrNull()
                for (id in counterIds) {
                    try {
                        val views = buildCounterRemoteViews(context, firstCounter, id)
                        appWidgetManager.updateAppWidget(id, views)
                    } catch (e: Exception) {
                        val views = buildCounterRemoteViews(context, null, id)
                        appWidgetManager.updateAppWidget(id, views)
                    }
                }
            }
            val countdownIds = appWidgetManager.getAppWidgetIds(countdownProvider)
            if (countdownIds.isNotEmpty()) {
                val firstCountdown = countdowns.firstOrNull()
                for (id in countdownIds) {
                    try {
                        val views = buildCountdownRemoteViews(context, firstCountdown, id)
                        appWidgetManager.updateAppWidget(id, views)
                    } catch (e: Exception) {
                        val views = buildCountdownRemoteViews(context, null, id)
                        appWidgetManager.updateAppWidget(id, views)
                    }
                }
            }
            val dailyTasksIds = appWidgetManager.getAppWidgetIds(dailyTasksProvider)
            if (dailyTasksIds.isNotEmpty()) {
                for (id in dailyTasksIds) {
                    try {
                        val views = buildDailyTasksRemoteViews(context, dailyTasksPayload, cache)
                        appWidgetManager.updateAppWidget(id, views)
                    } catch (e: Exception) {
                        val views = buildDailyTasksRemoteViews(context, null, defaultCache)
                        appWidgetManager.updateAppWidget(id, views)
                    }
                }
            }
            val hourCalculationIds = appWidgetManager.getAppWidgetIds(hourCalculationProvider)
            val hourState = loadHourCalculationState(context)
            if (hourCalculationIds.isNotEmpty()) {
                for (id in hourCalculationIds) {
                    try {
                        val views = buildHourCalculationRemoteViews(context, hourState, id)
                        appWidgetManager.updateAppWidget(id, views)
                    } catch (e: Exception) {
                        val views = buildHourCalculationRemoteViews(context, null, id)
                        appWidgetManager.updateAppWidget(id, views)
                    }
                }
                if (hourState?.isRunning == true) {
                    scheduleStopwatchTick(context)
                }
            }
        }

        private fun loadWidgetCache(context: Context): WidgetCache? {
            return try {
                MMKV.initialize(context)
                val mmkv = MMKV.mmkvWithID(MMKV_ID)
                val json = mmkv?.decodeString(WIDGET_CACHE_KEY) ?: return null
                parseCache(json)
            } catch (e: Exception) {
                null
            }
        }

        private data class CustomCounterModel(val id: String, val title: String, val count: Int)

        private fun loadCustomCounters(context: Context): List<CustomCounterModel> {
            return try {
                MMKV.initialize(context)
                val mmkv = MMKV.mmkvWithID(MMKV_ID)
                val json = mmkv?.decodeString(CUSTOM_COUNTERS_KEY) ?: return emptyList()
                val arr = org.json.JSONArray(json)
                (0 until arr.length()).map { i ->
                    val obj = arr.getJSONObject(i)
                    CustomCounterModel(
                        id = obj.optString("id", ""),
                        title = obj.optString("title", "Counter"),
                        count = obj.optInt("count", 0)
                    )
                }
            } catch (e: Exception) {
                emptyList()
            }
        }

        private fun incrementCounterPendingIntent(context: Context, counterId: String, appWidgetId: Int): PendingIntent {
            val intent = Intent(context, CounterIncrementReceiver::class.java).apply {
                action = CounterIncrementReceiver.ACTION_INCREMENT
                putExtra(CounterIncrementReceiver.EXTRA_COUNTER_ID, counterId)
            }
            val requestCode = PENDING_INTENT_COUNTER_BASE + (appWidgetId and 0x7FFF)
            return PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        private fun buildCounterRemoteViews(context: Context, counter: CustomCounterModel?, appWidgetId: Int): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_counter)
            if (counter != null) {
                views.setTextViewText(R.id.widget_counter_title, counter.title)
                views.setTextViewText(R.id.widget_counter_count, counter.count.toString())
                views.setOnClickPendingIntent(R.id.widget_root, incrementCounterPendingIntent(context, counter.id, appWidgetId))
            } else {
                views.setTextViewText(R.id.widget_counter_title, "Add a counter in Until")
                views.setTextViewText(R.id.widget_counter_count, "0")
                val openApp = PendingIntent.getActivity(
                    context,
                    PENDING_INTENT_COUNTER_BASE + (appWidgetId and 0x7FFF),
                    context.packageManager.getLaunchIntentForPackage(context.packageName)!!.apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    },
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, openApp)
            }
            return views
        }

        private data class CountdownModel(val id: String, val title: String, val date: String)

        private fun loadCountdowns(context: Context): List<CountdownModel> {
            return try {
                MMKV.initialize(context)
                val mmkv = MMKV.mmkvWithID(MMKV_ID)
                val json = mmkv?.decodeString(COUNTDOWNS_KEY) ?: return emptyList()
                val arr = JSONArray(json)
                (0 until arr.length()).map { i ->
                    val obj = arr.getJSONObject(i)
                    CountdownModel(
                        id = obj.optString("id", ""),
                        title = obj.optString("title", "Deadline"),
                        date = obj.optString("date", "")
                    )
                }
            } catch (e: Exception) {
                emptyList()
            }
        }

        private fun daysLeft(dateStr: String): Int {
            if (dateStr.length < 10) return 0
            return try {
                val y = dateStr.substring(0, 4).toInt()
                val m = dateStr.substring(5, 7).toInt() - 1
                val d = dateStr.substring(8, 10).toInt()
                val today = Calendar.getInstance().apply {
                    set(Calendar.HOUR_OF_DAY, 0)
                    set(Calendar.MINUTE, 0)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }
                val target = Calendar.getInstance().apply {
                    set(y, m, d, 0, 0, 0)
                    set(Calendar.MILLISECOND, 0)
                }
                val diffMs = target.timeInMillis - today.timeInMillis
                val diffDays = (diffMs / (24 * 60 * 60 * 1000)).toInt()
                maxOf(0, diffDays)
            } catch (e: Exception) {
                0
            }
        }

        private fun countdownDaysText(days: Int): String {
            return when (days) {
                0 -> "Today"
                1 -> "1 day left"
                else -> "$days days left"
            }
        }

        private data class DailyTaskCatStat(val completed: Int, val total: Int)

        private data class DailyTasksPayload(
            val date: String,
            val completed: Int,
            val total: Int,
            val pending: Int,
            val byCategory: Map<String, DailyTaskCatStat>
        )

        private val dailyTasksCategoryOrder = listOf("health", "work", "personal_care", "learning", "other")
        private val dailyTasksCategoryLabels = mapOf(
            "health" to "Health",
            "work" to "Work",
            "personal_care" to "Personal care",
            "learning" to "Learning",
            "other" to "Other"
        )

        private fun loadDailyTasksPayload(context: Context): DailyTasksPayload? {
            return try {
                MMKV.initialize(context)
                val mmkv = MMKV.mmkvWithID(MMKV_ID)
                val json = mmkv?.decodeString(DAILY_TASKS_WIDGET_KEY) ?: return null
                val obj = JSONObject(json)
                val byCat = mutableMapOf<String, DailyTaskCatStat>()
                if (obj.has("byCategory")) {
                    val catObj = obj.getJSONObject("byCategory")
                    for (key in dailyTasksCategoryOrder) {
                        if (catObj.has(key)) {
                            val c = catObj.getJSONObject(key)
                            byCat[key] = DailyTaskCatStat(
                                completed = c.optInt("completed", 0),
                                total = c.optInt("total", 0)
                            )
                        }
                    }
                }
                DailyTasksPayload(
                    date = obj.optString("date", ""),
                    completed = obj.optInt("completed", 0),
                    total = obj.optInt("total", 0),
                    pending = obj.optInt("pending", 0),
                    byCategory = byCat
                )
            } catch (e: Exception) {
                null
            }
        }

        private fun createDailyTasksPieBitmap(completed: Int, total: Int): Bitmap? {
            return try {
                val sizePx = 144
                val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bitmap)
                val center = sizePx / 2f
                val rOuter = center - 4f
                val rInner = rOuter * 0.58f
                val progress = if (total > 0) (completed.toFloat() / total).coerceIn(0f, 1f) else 0f
                val green = Color.parseColor("#34C759")
                val orange = Color.parseColor("#E87C20")
                val gray = Color.parseColor("#444444")
                val oval = android.graphics.RectF(center - rOuter, center - rOuter, center + rOuter, center + rOuter)
                val innerOval = android.graphics.RectF(center - rInner, center - rInner, center + rInner, center + rInner)
                val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
                if (total > 0) {
                    if (progress >= 1f) {
                        paint.color = green
                        canvas.drawCircle(center, center, rOuter, paint)
                        paint.color = Color.BLACK
                        canvas.drawCircle(center, center, rInner, paint)
                    } else {
                        paint.color = green
                        canvas.drawArc(oval, -90f, progress * 360f, true, paint)
                        paint.color = orange
                        canvas.drawArc(oval, -90f + progress * 360f, (1f - progress) * 360f, true, paint)
                        paint.color = Color.BLACK
                        canvas.drawCircle(center, center, rInner, paint)
                    }
                } else {
                    paint.color = gray
                    paint.style = Paint.Style.STROKE
                    paint.strokeWidth = 4f
                    canvas.drawCircle(center, center, rOuter - 2f, paint)
                }
                bitmap
            } catch (e: Exception) {
                null
            }
        }

        private val widgetDailyTasksCatIds = listOf(
            R.id.widget_daily_tasks_cat1,
            R.id.widget_daily_tasks_cat2,
            R.id.widget_daily_tasks_cat3,
            R.id.widget_daily_tasks_cat4,
            R.id.widget_daily_tasks_cat5
        )

        private fun getDailyTasksWidgetPage(context: Context): Int {
            return context.getSharedPreferences(DailyTasksWidgetTapReceiver.PREFS_NAME, Context.MODE_PRIVATE)
                .getInt(DailyTasksWidgetTapReceiver.KEY_PAGE, 0)
        }

        private fun buildDailyTasksRemoteViews(context: Context, payload: DailyTasksPayload?, cache: WidgetCache): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_daily_tasks_flipper)
            // Page 0: Daily tasks
            if (payload != null && payload.total >= 0) {
                views.setTextViewText(R.id.widget_daily_tasks_value, "${payload.completed}/${payload.total}")
                val progress = if (payload.total > 0) (payload.completed * 100 / payload.total).coerceIn(0, 100) else 0
                views.setProgressBar(R.id.widget_daily_tasks_progress, 100, progress, false)
                val pct = if (payload.total > 0) (payload.completed * 100 / payload.total).coerceIn(0, 100) else 0
                views.setTextViewText(R.id.widget_daily_tasks_sub, "$pct% · ${payload.pending} pending")
                views.setViewVisibility(R.id.widget_daily_tasks_sub, android.view.View.VISIBLE)
                val pieBitmap = createDailyTasksPieBitmap(payload.completed, payload.total)
                if (pieBitmap != null && !pieBitmap.isRecycled) {
                    views.setImageViewBitmap(R.id.widget_daily_tasks_pie, pieBitmap)
                }
                val categoryLines = dailyTasksCategoryOrder.mapNotNull { key ->
                    payload.byCategory[key]?.let { stat ->
                        if (stat.total > 0) (dailyTasksCategoryLabels[key] ?: key) + " ${stat.completed}/${stat.total}" else null
                    }
                }
                widgetDailyTasksCatIds.forEachIndexed { index, id ->
                    if (index < categoryLines.size) {
                        views.setTextViewText(id, categoryLines[index])
                        views.setViewVisibility(id, android.view.View.VISIBLE)
                    } else {
                        views.setViewVisibility(id, android.view.View.GONE)
                    }
                }
            } else {
                views.setTextViewText(R.id.widget_daily_tasks_value, "0/0")
                views.setProgressBar(R.id.widget_daily_tasks_progress, 100, 0, false)
                views.setViewVisibility(R.id.widget_daily_tasks_sub, android.view.View.GONE)
                val pieBitmap = createDailyTasksPieBitmap(0, 0)
                if (pieBitmap != null && !pieBitmap.isRecycled) {
                    views.setImageViewBitmap(R.id.widget_daily_tasks_pie, pieBitmap)
                }
                widgetDailyTasksCatIds.forEach { views.setViewVisibility(it, android.view.View.GONE) }
            }
            // Page 1: Day progress
            val dDone = cache.dayPercentDone.coerceIn(0, 100)
            val dLeft = cache.dayPercentLeft.coerceIn(0, 100)
            val dProgress = cache.dayProgress.coerceIn(0.0, 1.0)
            views.setTextViewText(R.id.widget_day_done, context.getString(R.string.widget_day_done_format, dDone))
            views.setTextViewText(R.id.widget_day_left, context.getString(R.string.widget_day_left_format, dLeft))
            val (passedText, leftText) = dayTimeTexts(context, cache, dProgress)
            views.setTextViewText(R.id.widget_day_hours_passed, passedText)
            views.setTextViewText(R.id.widget_day_hours_left, leftText)
            try {
                val dotsBitmap = createDayDotsBitmap(context, dProgress)
                if (dotsBitmap != null && !dotsBitmap.isRecycled) {
                    views.setImageViewBitmap(R.id.widget_day_dots, dotsBitmap)
                }
            } catch (e: Exception) { }
            // Which page to show (tap to flip)
            val page = getDailyTasksWidgetPage(context)
            views.setDisplayedChild(R.id.widget_flipper, page)
            val toggleIntent = Intent(context, DailyTasksWidgetTapReceiver::class.java).apply {
                action = DailyTasksWidgetTapReceiver.ACTION_TOGGLE_PAGE
            }
            val togglePending = PendingIntent.getBroadcast(
                context,
                PENDING_INTENT_DAILY_TASKS,
                toggleIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, togglePending)
            return views
        }

        private fun buildCountdownRemoteViews(context: Context, countdown: CountdownModel?, appWidgetId: Int): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_countdown)
            if (countdown != null) {
                val days = daysLeft(countdown.date)
                views.setTextViewText(R.id.widget_countdown_title, countdown.title)
                views.setTextViewText(R.id.widget_countdown_days, countdownDaysText(days))
                val openApp = PendingIntent.getActivity(
                    context,
                    appWidgetId,
                    context.packageManager.getLaunchIntentForPackage(context.packageName)!!.apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) },
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, openApp)
            } else {
                views.setTextViewText(R.id.widget_countdown_title, "Add a countdown in Until")
                views.setTextViewText(R.id.widget_countdown_days, "0 days left")
                val openApp = PendingIntent.getActivity(
                    context,
                    appWidgetId,
                    context.packageManager.getLaunchIntentForPackage(context.packageName)!!.apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) },
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, openApp)
            }
            return views
        }

        internal data class HourCalculationState(
            val title: String,
            val isRunning: Boolean,
            val startTimeMs: Long,
            val totalElapsedMs: Long
        )

        private fun loadHourCalculationState(context: Context): HourCalculationState? {
            return try {
                MMKV.initialize(context)
                val mmkv = MMKV.mmkvWithID(MMKV_ID) ?: return null
                val json = mmkv.decodeString(HOUR_CALCULATION_WIDGET_KEY) ?: return null
                val obj = JSONObject(json)
                HourCalculationState(
                    title = obj.optString("title", "Hour timer"),
                    isRunning = obj.optBoolean("isRunning", false),
                    startTimeMs = obj.optLong("startTimeMs", 0L),
                    totalElapsedMs = obj.optLong("totalElapsedMs", 0L)
                )
            } catch (e: Exception) {
                null
            }
        }

        private fun formatElapsedMs(totalElapsedMs: Long, startTimeMs: Long, isRunning: Boolean): String {
            val now = System.currentTimeMillis()
            val totalMs = totalElapsedMs + if (isRunning && startTimeMs > 0) (now - startTimeMs) else 0L
            val totalSec = (totalMs / 1000).coerceAtLeast(0L)
            val h = totalSec / 3600
            val m = (totalSec % 3600) / 60
            val s = totalSec % 60
            return "%d:%02d:%02d".format(h, m, s)
        }

        private fun buildHourCalculationRemoteViews(context: Context, state: HourCalculationState?, appWidgetId: Int): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_hour_calculation)
            val title = state?.title?.takeIf { it.isNotBlank() } ?: "Hour timer"
            val isRunning = state?.isRunning ?: false
            val startTimeMs = state?.startTimeMs ?: 0L
            val totalElapsedMs = state?.totalElapsedMs ?: 0L
            views.setTextViewText(R.id.widget_hour_calc_title, title)
            views.setTextViewText(R.id.widget_hour_calc_time, formatElapsedMs(totalElapsedMs, startTimeMs, isRunning))
            views.setTextViewText(R.id.widget_hour_calc_hint, if (isRunning) "Tap to stop" else "Tap to start")
            val toggleIntent = Intent(context, HourCalculationTapReceiver::class.java).apply {
                action = HourCalculationTapReceiver.ACTION_TOGGLE
            }
            val togglePending = PendingIntent.getBroadcast(
                context,
                PENDING_INTENT_HOUR_CALCULATION + (appWidgetId and 0x7FFF),
                toggleIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, togglePending)
            return views
        }

        fun scheduleStopwatchTick(context: Context) {
            val request = OneTimeWorkRequestBuilder<StopwatchTickWorker>()
                .setInitialDelay(1, TimeUnit.SECONDS)
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                STOPWATCH_TICK_WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                request
            )
        }

        /** Used by StopwatchTickWorker to decide whether to reschedule. */
        internal fun loadHourCalculationStatePublic(context: Context): HourCalculationState? =
            loadHourCalculationState(context)

        private fun dayTimeTexts(context: Context, cache: WidgetCache, dProgress: Double): Pair<String, String> {
            val start = cache.startOfDay
            val end = cache.endOfDay
            if (start != null && end != null) {
                val nowMs = System.currentTimeMillis()
                val passedSec = ((nowMs - start) / 1000).toInt().coerceIn(0, ((end - start) / 1000).toInt())
                val remainingSec = ((end - nowMs) / 1000).toInt().coerceIn(0, Int.MAX_VALUE)
                val passedH = passedSec / 3600
                val passedM = (passedSec % 3600) / 60
                val passedS = passedSec % 60
                val leftH = remainingSec / 3600
                val leftM = (remainingSec % 3600) / 60
                val leftS = remainingSec % 60
                val passedText = context.getString(R.string.widget_day_time_passed_sec_format, passedH, passedM, passedS)
                val leftText = context.getString(R.string.widget_day_time_left_sec_format, leftH, leftM, leftS)
                return passedText to leftText
            }
            val pm = cache.dayPassedMinutes
            val rm = cache.dayRemainingMinutes
            val passedText = if (pm != null) {
                val h = pm / 60
                val m = pm % 60
                val s = 0
                context.getString(R.string.widget_day_time_passed_sec_format, h, m, s)
            } else {
                val h = (dProgress * 24.0).toInt().coerceIn(0, 24)
                context.getString(R.string.widget_day_time_passed_sec_format, h, 0, 0)
            }
            val leftText = if (rm != null) {
                val h = rm / 60
                val m = rm % 60
                val s = 0
                context.getString(R.string.widget_day_time_left_sec_format, h, m, s)
            } else {
                val h = (24 - (dProgress * 24.0).toInt().coerceIn(0, 24)).coerceIn(0, 24)
                context.getString(R.string.widget_day_time_left_sec_format, h, 0, 0)
            }
            return passedText to leftText
        }

        private fun parseCache(json: String): WidgetCache? {
            return try {
                val obj = JSONObject(json)
                WidgetCache(
                    dayPercentDone = obj.optInt("dayPercentDone", 0),
                    dayPercentLeft = obj.optInt("dayPercentLeft", 0),
                    dayPassedMinutes = if (obj.has("dayPassedMinutes")) obj.optInt("dayPassedMinutes", 0) else null,
                    dayRemainingMinutes = if (obj.has("dayRemainingMinutes")) obj.optInt("dayRemainingMinutes", 0) else null,
                    startOfDay = if (obj.has("startOfDay")) obj.optLong("startOfDay", 0L).takeIf { it != 0L } else null,
                    endOfDay = if (obj.has("endOfDay")) obj.optLong("endOfDay", 0L).takeIf { it != 0L } else null,
                    monthIndex = obj.optInt("monthIndex", 1).coerceIn(1, 12),
                    monthDaysPassed = obj.optInt("monthDaysPassed", 0),
                    monthDaysLeft = obj.optInt("monthDaysLeft", 0),
                    monthPercent = obj.optInt("monthPercent", 0),
                    yearDaysPassed = obj.optInt("yearDaysPassed", 0),
                    yearDaysLeft = obj.optInt("yearDaysLeft", 0),
                    yearPercent = obj.optInt("yearPercent", 0),
                    dayProgress = obj.optDouble("dayProgress", 0.0),
                    monthProgress = obj.optDouble("monthProgress", 0.0),
                    yearProgress = obj.optDouble("yearProgress", 0.0),
                    lifeProgress = if (obj.has("lifeProgress") && !obj.isNull("lifeProgress")) {
                        obj.optDouble("lifeProgress", 0.0)
                    } else null,
                    remainingDaysLife = if (obj.has("remainingDaysLife") && !obj.isNull("remainingDaysLife")) {
                        obj.optInt("remainingDaysLife", 0)
                    } else null,
                    lifePercent = if (obj.has("lifePercent") && !obj.isNull("lifePercent")) {
                        obj.optInt("lifePercent", 0)
                    } else null,
                    updatedAt = obj.optLong("updatedAt", 0L)
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
                R.layout.widget_life -> PENDING_INTENT_LIFE
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
                // Widget-level entitlement check (Android widgets can be added by users, so we must gate display here too).
                val nowMs = System.currentTimeMillis()
                val mmkv = MMKV.mmkvWithID(MMKV_ID)
                val isPremiumActive = mmkv?.decodeBool(STORAGE_KEY_PREMIUM_IS_ACTIVE, false) ?: false
                val trialStartMs = mmkv?.decodeLong(STORAGE_KEY_TRIAL_START_DATE, 0L) ?: 0L
                val trialActive = trialStartMs > 0L && nowMs <= trialStartMs + TRIAL_DURATION_MS
                val effectivePremium = isPremiumActive || trialActive
                val lifeUnlockUntil = mmkv?.decodeLong(STORAGE_KEY_LIFE_UNLOCK_UNTIL, 0L) ?: 0L
                val lifeEventUnlockActive = lifeUnlockUntil > nowMs && lifeUnlockUntil != 0L
                val canAccessLife = effectivePremium || lifeEventUnlockActive

                when (layoutId) {
                    R.layout.widget_day -> {
                        val dDone = cache.dayPercentDone.coerceIn(0, 100)
                        val dLeft = cache.dayPercentLeft.coerceIn(0, 100)
                        val dProgress = cache.dayProgress.coerceIn(0.0, 1.0)
                        views.setTextViewText(R.id.widget_day_done, context.getString(R.string.widget_day_done_format, dDone))
                        views.setTextViewText(R.id.widget_day_left, context.getString(R.string.widget_day_left_format, dLeft))
                        // Time passed/left: use SSOT from cache (minutes) when present, else compute from progress
                        val (passedText, leftText) = dayTimeTexts(context, cache, dProgress)
                        views.setTextViewText(R.id.widget_day_hours_passed, passedText)
                        views.setTextViewText(R.id.widget_day_hours_left, leftText)
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
                        if (!effectivePremium) {
                            views.setTextViewText(R.id.widget_month_passed, context.getString(R.string.widget_life_locked))
                            views.setTextViewText(R.id.widget_month_left, context.getString(R.string.widget_life_locked))
                            views.setTextViewText(R.id.widget_month_percent, context.getString(R.string.widget_life_locked))
                            views.setTextViewText(R.id.widget_month_label, context.getString(R.string.widget_life_locked))
                            views.setProgressBar(R.id.widget_month_progress, 100, 0, false)
                        } else {
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
                                val dotsBitmap = createMonthDotsBitmap(context, cache.monthIndex)
                                if (dotsBitmap != null && !dotsBitmap.isRecycled) {
                                    views.setImageViewBitmap(R.id.widget_month_dots, dotsBitmap)
                                }
                            } catch (e: Exception) {
                                // Dots optional; text already set so widget still shows data
                            }
                        }
                    }
                    R.layout.widget_year -> {
                        val yearPassed = cache.yearDaysPassed.coerceIn(0, 365)
                        val yearLeft = cache.yearDaysLeft.coerceIn(0, 365)
                        val yearProgressClamped = cache.yearProgress.coerceIn(0.0, 1.0)
                        val yearConsumedPct = (yearProgressClamped * 100.0).toInt().coerceIn(0, 100)
                        val yearLeftPct = (100 - yearConsumedPct).coerceIn(0, 100)
                        views.setTextViewText(
                            R.id.widget_year_passed,
                            context.getString(R.string.widget_year_passed_format, yearPassed, yearConsumedPct)
                        )
                        views.setTextViewText(
                            R.id.widget_year_left,
                            context.getString(R.string.widget_year_left_format, yearLeft, yearLeftPct)
                        )
                        views.setTextViewText(R.id.widget_year_percent, context.getString(R.string.widget_year_percent_format, yearConsumedPct))
                        views.setProgressBar(R.id.widget_year_progress, 100, yearConsumedPct, false)
                        try {
                            val dotsBitmap = createYearDotsBitmap(context, yearProgressClamped, yearPassed)
                            if (dotsBitmap != null && !dotsBitmap.isRecycled) {
                                views.setImageViewBitmap(R.id.widget_year_dots, dotsBitmap)
                            }
                        } catch (e: Exception) {
                            // Dots optional; text/progress already set so widget still shows data
                        }
                    }
                    R.layout.widget_life -> {
                        if (!canAccessLife) {
                            // Premium not active yet (trial expired + life unlock not reached).
                            views.setTextViewText(R.id.widget_life_passed, context.getString(R.string.widget_life_locked))
                            views.setTextViewText(R.id.widget_life_left, "")
                            views.setTextViewText(R.id.widget_life_percent, context.getString(R.string.widget_life_locked))
                            views.setTextViewText(R.id.widget_life_label, context.getString(R.string.widget_life_locked))
                            views.setProgressBar(R.id.widget_life_progress, 100, 0, false)
                        } else {
                            // If birth date isn't available yet, SSOT cache values can be null.
                            val lifeProgress = cache.lifeProgress
                            val remainingDaysLife = cache.remainingDaysLife
                            val lifePercent = cache.lifePercent
                            if (lifeProgress == null || remainingDaysLife == null || lifePercent == null) {
                                views.setTextViewText(
                                    R.id.widget_life_label,
                                    "${context.getString(R.string.widget_life_empty_line1)}\n${context.getString(R.string.widget_life_empty_line2)}",
                                )
                                views.setTextViewText(R.id.widget_life_passed, "")
                                views.setTextViewText(R.id.widget_life_left, "")
                                views.setTextViewText(R.id.widget_life_percent, "0%")
                                views.setProgressBar(R.id.widget_life_progress, 100, 0, false)
                            } else {
                                val clamped = lifeProgress.coerceIn(0.0, 1.0)
                                val consumedPct = lifePercent.coerceIn(0, 100)
                                val leftPct = (100 - consumedPct).coerceIn(0, 100)
                                val totalDaysPassed = (clamped * 365.25).toInt().coerceIn(0, 365)
                                val leftDays = remainingDaysLife.coerceIn(0, 365)

                                views.setTextViewText(
                                    R.id.widget_life_passed,
                                    context.getString(R.string.widget_life_passed_format, totalDaysPassed, consumedPct),
                                )
                                views.setTextViewText(
                                    R.id.widget_life_left,
                                    context.getString(R.string.widget_life_left_format, leftDays, leftPct),
                                )
                                views.setTextViewText(
                                    R.id.widget_life_percent,
                                    context.getString(R.string.widget_life_percent_format, consumedPct),
                                )
                                views.setProgressBar(R.id.widget_life_progress, 100, consumedPct, false)

                                try {
                                    val dotsBitmap = createYearDotsBitmap(context, clamped, totalDaysPassed)
                                    if (dotsBitmap != null && !dotsBitmap.isRecycled) {
                                        views.setImageViewBitmap(R.id.widget_life_dots, dotsBitmap)
                                    }
                                } catch (_: Exception) {
                                    // Dots optional
                                }
                            }
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

        /** Month dots: 12 dots = Jan..Dec. Orange = current month (monthIndex 1–12). */
        private fun createMonthDotsBitmap(context: Context, monthIndex: Int): Bitmap? {
            return try {
                val totalDots = 12
                val cols = 6
                val rows = 2
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

                val idx = monthIndex.coerceIn(1, 12)
                val currentMonth = idx - 1
                val passedMonths = currentMonth

                val cellW = bitmapWidth / cols.toFloat()
                val cellH = bitmapHeight / rows.toFloat()
                // 30% bigger dots (as requested)
                val radius = 5.2f * 1.3f
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

class DayWidgetTickWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        UNTILWidgetWorker.updateWidgets(applicationContext)
        val dayIds = AppWidgetManager.getInstance(applicationContext)
            .getAppWidgetIds(ComponentName(applicationContext, UNTILDayWidgetProvider::class.java))
        if (dayIds.isNotEmpty()) {
            UNTILWidgetWorker.scheduleDayTick(applicationContext)
        }
        return Result.success()
    }
}

class StopwatchTickWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        UNTILWidgetWorker.updateWidgets(applicationContext)
        val hourIds = AppWidgetManager.getInstance(applicationContext)
            .getAppWidgetIds(ComponentName(applicationContext, UNTILHourCalculationWidgetProvider::class.java))
        if (hourIds.isNotEmpty()) {
            val state = UNTILWidgetWorker.loadHourCalculationStatePublic(applicationContext)
            if (state?.isRunning == true) {
                UNTILWidgetWorker.scheduleStopwatchTick(applicationContext)
            }
        }
        return Result.success()
    }
}

/** Runs at midnight to refresh month/year/countdown widgets (values change daily). Reschedules for next midnight. */
class DailyMidnightWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        UNTILWidgetWorker.updateWidgets(applicationContext)
        UNTILWidgetWorker.scheduleDailyMidnight(applicationContext)
        return Result.success()
    }
}

private data class WidgetCache(
    val dayPercentDone: Int,
    val dayPercentLeft: Int,
    val dayPassedMinutes: Int? = null,
    val dayRemainingMinutes: Int? = null,
    val startOfDay: Long? = null,
    val endOfDay: Long? = null,
    val monthIndex: Int = 1,
    val monthDaysPassed: Int,
    val monthDaysLeft: Int,
    val monthPercent: Int,
    val yearDaysPassed: Int,
    val yearDaysLeft: Int,
    val yearPercent: Int,
    val dayProgress: Double,
    val monthProgress: Double,
    val yearProgress: Double,
    val lifeProgress: Double? = null,
    val remainingDaysLife: Int? = null,
    val lifePercent: Int? = null,
    val updatedAt: Long = 0L
)
