package app.until.time

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.tencent.mmkv.MMKV
import org.json.JSONObject
import java.util.Calendar

private const val NOTIFICATION_CHANNEL_ID = "until_overlay"
private const val NOTIFICATION_ID = 9001
private const val MMKV_ID = "until-storage"
private const val WIDGET_CACHE_KEY = "widget.cache"
private const val DAILY_TASKS_WIDGET_KEY = "daily.tasks.widget"
private const val HOUR_CALCULATION_WIDGET_KEY = "hour.calculation.widget"
private const val OVERLAY_WIDGET_TYPE_KEY = "overlay.widgetType"
private const val OVERLAY_ENABLED_KEY = "overlay.enabled"
private const val UPDATE_INTERVAL_MS = 1000L

/**
 * Floating overlay service – Android equivalent of iOS Dynamic Island.
 * Shows a compact pill that expands on tap. Reads from MMKV (SSOT: same as widgets).
 */
class UNTILOverlayService : Service() {

    private var windowManager: WindowManager? = null
    private var overlayView: FrameLayout? = null
    private var params: WindowManager.LayoutParams? = null
    private var updateHandler: Handler? = null
    private val updateRunnable = object : Runnable {
        override fun run() {
            overlayView?.let { safeUpdateOverlayContent(it) }
            updateHandler?.postDelayed(this, UPDATE_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                try {
                    startForeground(NOTIFICATION_ID, createNotification())
                } catch (e: Exception) {
                    stopSelf()
                    return START_STICKY
                }
                showOverlay()
            }
            ACTION_STOP -> stopSelf()
            ACTION_UPDATE -> overlayView?.let { safeUpdateOverlayContent(it) }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        updateHandler?.removeCallbacks(updateRunnable)
        removeOverlay()
        MMKV.mmkvWithID(MMKV_ID)?.encode(OVERLAY_ENABLED_KEY, false)
        super.onDestroy()
    }

    private fun showOverlay() {
        if (overlayView != null) return
        if (!canDrawOverlays()) {
            stopSelf()
            return
        }

        val inflater = LayoutInflater.from(applicationContext)
        val root = inflater.inflate(R.layout.overlay_root, null) as FrameLayout

        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            x = 0
            y = 120
        }

        setupTouchListeners(root)
        root.findViewById<View>(R.id.overlay_expanded)?.visibility = View.GONE
        root.findViewById<View>(R.id.overlay_compact)?.visibility = View.VISIBLE
        safeUpdateOverlayContent(root)

        try {
            windowManager?.addView(root, params)
        } catch (e: Exception) {
            stopSelf()
            return
        }
        overlayView = root
        MMKV.mmkvWithID(MMKV_ID)?.encode(OVERLAY_ENABLED_KEY, true)

        updateHandler = Handler(Looper.getMainLooper())
        updateHandler?.postDelayed(updateRunnable, UPDATE_INTERVAL_MS)
    }

    private fun removeOverlay() {
        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (e: Exception) { /* already removed */ }
        }
        overlayView = null
        params = null
        try {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } catch (e: Exception) { /* ignore */ }
    }

    private fun setupTouchListeners(root: FrameLayout) {
        val compact = root.findViewById<View>(R.id.overlay_compact)
        if (compact == null) return

        compact.setOnClickListener {
            // Keep compact-only behavior (no expand/collapse).
        }

        compact.setOnLongClickListener {
            openApp()
            true
        }

        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        compact.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params?.x ?: 0
                    initialY = params?.y ?: 0
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                }
                MotionEvent.ACTION_MOVE -> {
                    params?.let {
                        it.x = initialX + (event.rawX - initialTouchX).toInt()
                        it.y = initialY + (event.rawY - initialTouchY).toInt()
                        try {
                            windowManager?.updateViewLayout(root, it)
                        } catch (e: Exception) { /* view may be detached */ }
                    }
                }
            }
            false
        }
    }

    private fun safeUpdateOverlayContent(root: FrameLayout) {
        try {
            val state = loadOverlayState()
            root.findViewById<TextView>(R.id.overlay_compact_leading)?.text = state.leading
            root.findViewById<TextView>(R.id.overlay_compact_trailing)?.text = state.trailing
            root.findViewById<TextView>(R.id.overlay_expanded_title)?.text = state.expandedTitle
            root.findViewById<TextView>(R.id.overlay_expanded_subtitle)?.text = state.expandedSubtitle
            root.findViewById<ProgressBar>(R.id.overlay_expanded_progress)?.progress = state.progress
            root.findViewById<TextView>(R.id.overlay_glance_row)?.text = state.glanceRow
        } catch (e: Exception) {
            // Ignore update errors (e.g. view detached)
        }
    }

    private fun loadOverlayState(): OverlayState {
        return try {
            MMKV.initialize(this)
            val mmkv = MMKV.mmkvWithID(MMKV_ID) ?: return OverlayState.default()
        val widgetType = mmkv.decodeString(OVERLAY_WIDGET_TYPE_KEY, "day") ?: "day"

        val cacheJson = mmkv.decodeString(WIDGET_CACHE_KEY)
        val cache = cacheJson?.let { parseCache(it) }

        val dailyTasksJson = mmkv.decodeString(DAILY_TASKS_WIDGET_KEY)
        val dailyPayload = dailyTasksJson?.let { parseDailyTasks(it) }

        val hourCalcJson = mmkv.decodeString(HOUR_CALCULATION_WIDGET_KEY)
        val hourState = hourCalcJson?.let { parseHourCalc(it) }

        buildOverlayState(widgetType, cache, dailyPayload, hourState)
        } catch (e: Exception) {
            OverlayState.default()
        }
    }

    private fun parseCache(json: String): WidgetCache? = try {
        val obj = JSONObject(json)
        WidgetCache(
            dayPercentDone = obj.optInt("dayPercentDone", 0),
            dayPercentLeft = obj.optInt("dayPercentLeft", 0),
            startOfDay = if (obj.has("startOfDay")) obj.optLong("startOfDay", 0L).takeIf { it != 0L } else null,
            endOfDay = if (obj.has("endOfDay")) obj.optLong("endOfDay", 0L).takeIf { it != 0L } else null,
            monthDaysPassed = obj.optInt("monthDaysPassed", 0),
            monthDaysLeft = obj.optInt("monthDaysLeft", 0),
            monthPercent = obj.optInt("monthPercent", 0),
            monthProgress = obj.optDouble("monthProgress", 0.0),
            yearDaysPassed = obj.optInt("yearDaysPassed", 0),
            yearDaysLeft = obj.optInt("yearDaysLeft", 0),
            yearPercent = obj.optInt("yearPercent", 0),
            yearProgress = obj.optDouble("yearProgress", 0.0),
            lifePercent = if (obj.has("lifePercent")) obj.optInt("lifePercent", 0) else null,
            remainingDaysLife = if (obj.has("remainingDaysLife")) obj.optInt("remainingDaysLife", 0) else null,
            dayProgress = obj.optDouble("dayProgress", 0.0)
        )
    } catch (e: Exception) {
        null
    }

    private fun parseDailyTasks(json: String): DailyPayload? = try {
        val obj = JSONObject(json)
        DailyPayload(
            completed = obj.optInt("completed", 0),
            total = obj.optInt("total", 0)
        )
    } catch (e: Exception) {
        null
    }

    private fun parseHourCalc(json: String): HourState? = try {
        val obj = JSONObject(json)
        HourState(
            title = obj.optString("title", "Hour timer"),
            isRunning = obj.optBoolean("isRunning", false),
            startTimeMs = obj.optLong("startTimeMs", 0L),
            totalElapsedMs = obj.optLong("totalElapsedMs", 0L)
        )
    } catch (e: Exception) {
        null
    }

    private fun buildOverlayState(
        widgetType: String,
        cache: WidgetCache?,
        dailyPayload: DailyPayload?,
        hourState: HourState?
    ): OverlayState {
        val c = cache ?: return OverlayState.default()
        val now = System.currentTimeMillis()

        return when (widgetType) {
            "month" -> OverlayState(
                leading = "${c.monthPercent}%",
                trailing = "${c.monthDaysLeft}d left",
                expandedTitle = "${c.monthDaysPassed}d passed",
                expandedSubtitle = "${c.monthPercent}% · ${c.monthDaysLeft}d left",
                progress = (c.monthProgress * 100).toInt().coerceIn(0, 100),
                glanceRow = "D${c.dayPercentDone}% · M${c.monthPercent}% · Y${c.yearPercent}%"
            )
            "year" -> OverlayState(
                leading = "${c.yearPercent}%",
                trailing = "${c.yearDaysLeft}d left",
                expandedTitle = "${c.yearDaysPassed}d passed",
                expandedSubtitle = "${c.yearPercent}% · ${c.yearDaysLeft}d left",
                progress = (c.yearProgress * 100).toInt().coerceIn(0, 100),
                glanceRow = "D${c.dayPercentDone}% · M${c.monthPercent}% · Y${c.yearPercent}%"
            )
            "life" -> {
                val lifePct = c.lifePercent ?: 0
                val daysLeft = c.remainingDaysLife ?: 0
                OverlayState(
                    leading = "$lifePct%",
                    trailing = "${daysLeft}d left",
                    expandedTitle = "$lifePct% lived",
                    expandedSubtitle = "${daysLeft}d left",
                    progress = lifePct,
                    glanceRow = "D${c.dayPercentDone}% · M${c.monthPercent}% · Y${c.yearPercent}%"
                )
            }
            "dailyTasks" -> {
                val total = dailyPayload?.total ?: 0
                val done = dailyPayload?.completed ?: 0
                val pct = if (total > 0) (done * 100 / total).coerceIn(0, 100) else 0
                OverlayState(
                    leading = "$done/$total",
                    trailing = "done",
                    expandedTitle = "$done/$total done",
                    expandedSubtitle = if (total > 0) "$pct%" else "No tasks",
                    progress = pct,
                    glanceRow = "D${c.dayPercentDone}% · M${c.monthPercent}% · Y${c.yearPercent}%"
                )
            }
            "hourCalc" -> {
                val h = hourState ?: HourState("Hour timer", false, 0L, 0L)
                val totalMs = h.totalElapsedMs + if (h.isRunning && h.startTimeMs > 0) (now - h.startTimeMs) else 0L
                val totalSec = (totalMs / 1000).coerceAtLeast(0L)
                val hours = totalSec / 3600
                val mins = (totalSec % 3600) / 60
                val secs = totalSec % 60
                val timeStr = "%d:%02d:%02d".format(hours, mins, secs)
                OverlayState(
                    leading = timeStr,
                    trailing = if (h.isRunning) "Running" else "Stopped",
                    expandedTitle = h.title,
                    expandedSubtitle = if (h.isRunning) "Running" else "Stopped",
                    progress = 0,
                    glanceRow = "D${c.dayPercentDone}% · M${c.monthPercent}% · Y${c.yearPercent}%"
                )
            }
            else -> {
                val (passed, left) = dayTimeTexts(c)
                OverlayState(
                    leading = "${c.dayPercentDone}%",
                    trailing = left,
                    expandedTitle = "${c.dayPercentDone}% done",
                    expandedSubtitle = left,
                    progress = c.dayPercentDone,
                    glanceRow = "D${c.dayPercentDone}% · M${c.monthPercent}% · Y${c.yearPercent}%"
                )
            }
        }
    }

    private fun dayTimeTexts(cache: WidgetCache): Pair<String, String> {
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
            return "%dh %dm %ds passed".format(passedH, passedM, passedS) to
                "%dh %dm %ds left".format(leftH, leftM, leftS)
        }
        return "${cache.dayPercentDone}% done" to "${cache.dayPercentLeft}% left"
    }

    private fun openApp() {
        try {
            val intent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            } ?: Intent(this, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
        } catch (e: Exception) {
            // Ignore if activity cannot be started
        }
    }

    private fun canDrawOverlays(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            android.provider.Settings.canDrawOverlays(this)
        } else {
            true
        }
    }

    private fun createNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Until overlay",
                NotificationManager.IMPORTANCE_LOW
            ).apply { setShowBadge(false) }
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
        }

        val openIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        } ?: Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        val pendingOpen = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, UNTILOverlayService::class.java).apply {
            action = ACTION_STOP
        }
        val pendingStop = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Until overlay")
            .setContentText("Floating time progress. Long-press to open Until.")
            .setSmallIcon(android.R.drawable.ic_menu_recent_history)
            .setContentIntent(pendingOpen)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", pendingStop)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private data class WidgetCache(
        val dayPercentDone: Int,
        val dayPercentLeft: Int,
        val startOfDay: Long? = null,
        val endOfDay: Long? = null,
        val monthDaysPassed: Int,
        val monthDaysLeft: Int,
        val monthPercent: Int,
        val monthProgress: Double,
        val yearDaysPassed: Int,
        val yearDaysLeft: Int,
        val yearPercent: Int,
        val yearProgress: Double,
        val lifePercent: Int?,
        val remainingDaysLife: Int?,
        val dayProgress: Double
    )

    private data class DailyPayload(val completed: Int, val total: Int)
    private data class HourState(val title: String, val isRunning: Boolean, val startTimeMs: Long, val totalElapsedMs: Long)

    private data class OverlayState(
        val leading: String,
        val trailing: String,
        val expandedTitle: String,
        val expandedSubtitle: String,
        val progress: Int,
        val glanceRow: String
    ) {
        companion object {
            fun default() = OverlayState(
                leading = "0%",
                trailing = "Open Until",
                expandedTitle = "Open Until to sync",
                expandedSubtitle = "Add widget to home screen",
                progress = 0,
                glanceRow = "D0% · M0% · Y0%"
            )
        }
    }

    companion object {
        const val ACTION_START = "app.until.time.OVERLAY_START"
        const val ACTION_STOP = "app.until.time.OVERLAY_STOP"
        const val ACTION_UPDATE = "app.until.time.OVERLAY_UPDATE"

        fun start(context: android.content.Context) {
            val intent = Intent(context, UNTILOverlayService::class.java).apply {
                action = ACTION_START
            }
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: android.content.Context) {
            val intent = Intent(context, UNTILOverlayService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }

        fun update(context: android.content.Context) {
            val intent = Intent(context, UNTILOverlayService::class.java).apply {
                action = ACTION_UPDATE
            }
            context.startService(intent)
        }
    }
}
