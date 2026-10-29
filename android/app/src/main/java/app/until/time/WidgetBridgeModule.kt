package app.until.time

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap

class WidgetBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetBridge"

    @ReactMethod
    fun updateWidgets() {
        reactApplicationContext.applicationContext?.let { ctx ->
            UNTILWidgetWorker.updateWidgets(ctx)
        }
    }

    @ReactMethod
    fun startOverlay() {
        reactApplicationContext.applicationContext?.let { ctx ->
            UNTILOverlayService.start(ctx)
        }
    }

    @ReactMethod
    fun stopOverlay() {
        reactApplicationContext.applicationContext?.let { ctx ->
            UNTILOverlayService.stop(ctx)
        }
    }

    @ReactMethod
    fun updateOverlay() {
        reactApplicationContext.applicationContext?.let { ctx ->
            UNTILOverlayService.update(ctx)
        }
    }

    @ReactMethod
    fun canDrawOverlays(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactApplicationContext.packageName}")
            ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
            reactApplicationContext.startActivity(intent)
        }
    }

    /** True when the launcher can show the "Add widget" prompt (Android 8+ and a launcher that supports pinning). */
    @ReactMethod
    fun canPinWidgets(promise: Promise) {
        promise.resolve(pinSupported())
    }

    /**
     * Asks the launcher to place one of our widgets on the home screen. The system shows its own
     * confirmation; resolves "requested" once the prompt is up, "unsupported" when the launcher or
     * Android version cannot do it, "unknown_kind" for a name we do not ship.
     */
    @ReactMethod
    fun requestPinWidget(kind: String, promise: Promise) {
        try {
            val ctx = reactApplicationContext.applicationContext ?: run {
                promise.resolve("unsupported")
                return
            }
            if (!pinSupported()) {
                promise.resolve("unsupported")
                return
            }
            val provider = when (kind) {
                "day" -> ComponentName(ctx, UNTILDayWidgetProvider::class.java)
                "year" -> ComponentName(ctx, UNTILYearWidgetProvider::class.java)
                "month" -> ComponentName(ctx, UNTILMonthWidgetProvider::class.java)
                "life" -> ComponentName(ctx, UNTILLifeWidgetProvider::class.java)
                "deadlines" -> ComponentName(ctx, UNTILDeadlinesWidgetProvider::class.java)
                else -> {
                    promise.resolve("unknown_kind")
                    return
                }
            }
            val requested = AppWidgetManager.getInstance(ctx).requestPinAppWidget(provider, null, null)
            promise.resolve(if (requested) "requested" else "unsupported")
        } catch (e: Exception) {
            promise.reject("PIN_WIDGET_ERROR", e.message, e)
        }
    }

    private fun pinSupported(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return false
        val ctx = reactApplicationContext.applicationContext ?: return false
        return AppWidgetManager.getInstance(ctx).isRequestPinAppWidgetSupported
    }

    @ReactMethod
    fun getWidgetStatus(promise: Promise) {
        try {
            val ctx = reactApplicationContext.applicationContext ?: run {
                promise.reject("NO_CONTEXT", "Application context not available")
                return
            }
            val appWidgetManager = AppWidgetManager.getInstance(ctx)
            val dayIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(ctx, UNTILDayWidgetProvider::class.java)
            )
            val monthIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(ctx, UNTILMonthWidgetProvider::class.java)
            )
            val yearIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(ctx, UNTILYearWidgetProvider::class.java)
            )
            val lifeIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(ctx, UNTILLifeWidgetProvider::class.java)
            )
            val counterIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(ctx, UNTILCounterWidgetProvider::class.java)
            )
            val countdownIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(ctx, UNTILCountdownWidgetProvider::class.java)
            )
            val deadlinesIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(ctx, UNTILDeadlinesWidgetProvider::class.java)
            )
            val dailyTasksIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(ctx, UNTILDailyTasksWidgetProvider::class.java)
            )
            val hourCalculationIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(ctx, UNTILHourCalculationWidgetProvider::class.java)
            )
            val map = WritableNativeMap().apply {
                putBoolean("dayWidgetAdded", dayIds.isNotEmpty())
                putBoolean("monthWidgetAdded", monthIds.isNotEmpty())
                putBoolean("yearWidgetAdded", yearIds.isNotEmpty())
                putBoolean("lifeWidgetAdded", lifeIds.isNotEmpty())
                putBoolean("counterWidgetAdded", counterIds.isNotEmpty())
                putBoolean("countdownWidgetAdded", countdownIds.isNotEmpty())
                putBoolean("deadlinesWidgetAdded", deadlinesIds.isNotEmpty())
                putBoolean("dailyTasksWidgetAdded", dailyTasksIds.isNotEmpty())
                putBoolean("hourCalculationWidgetAdded", hourCalculationIds.isNotEmpty())
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("WIDGET_STATUS_ERROR", e.message, e)
        }
    }
}
