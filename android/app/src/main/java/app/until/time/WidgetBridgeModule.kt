package app.until.time

import android.appwidget.AppWidgetManager
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
            val counterIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(ctx, UNTILCounterWidgetProvider::class.java)
            )
            val countdownIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(ctx, UNTILCountdownWidgetProvider::class.java)
            )
            val map = WritableNativeMap().apply {
                putBoolean("dayWidgetAdded", dayIds.isNotEmpty())
                putBoolean("monthWidgetAdded", monthIds.isNotEmpty())
                putBoolean("yearWidgetAdded", yearIds.isNotEmpty())
                putBoolean("counterWidgetAdded", counterIds.isNotEmpty())
                putBoolean("countdownWidgetAdded", countdownIds.isNotEmpty())
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("WIDGET_STATUS_ERROR", e.message, e)
        }
    }
}
