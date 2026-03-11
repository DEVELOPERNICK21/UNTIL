package app.until.time

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.tencent.mmkv.MMKV
import org.json.JSONObject

/**
 * Tap the Hour calculation widget: start or stop the stopwatch.
 * One timer only — tap toggles between running and stopped.
 * Time is calculated as totalElapsedMs + (if running: now - startTimeMs).
 */
class HourCalculationTapReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_TOGGLE) return
        toggleStopwatch(context)
        UNTILWidgetWorker.updateWidgets(context)
        if (isStopwatchRunning(context)) {
            UNTILWidgetWorker.scheduleStopwatchTick(context)
        }
    }

    private fun toggleStopwatch(context: Context) {
        MMKV.initialize(context)
        val mmkv = MMKV.mmkvWithID(MMKV_ID) ?: return
        val json = mmkv.decodeString(KEY_HOUR_CALCULATION) ?: defaultJson()
        try {
            val obj = JSONObject(json)
            val isRunning = obj.optBoolean(KEY_IS_RUNNING, false)
            var totalElapsedMs = obj.optLong(KEY_TOTAL_ELAPSED_MS, 0L)
            var startTimeMs = obj.optLong(KEY_START_TIME_MS, 0L)
            val title = obj.optString(KEY_TITLE, DEFAULT_TITLE)

            val now = System.currentTimeMillis()
            if (isRunning) {
                totalElapsedMs += (now - startTimeMs)
                startTimeMs = 0L
            } else {
                startTimeMs = now
            }

            val newObj = JSONObject().apply {
                put(KEY_TITLE, title)
                put(KEY_IS_RUNNING, !isRunning)
                put(KEY_START_TIME_MS, startTimeMs)
                put(KEY_TOTAL_ELAPSED_MS, totalElapsedMs)
            }
            mmkv.encode(KEY_HOUR_CALCULATION, newObj.toString())
        } catch (e: Exception) {
            // Reset to default and start
            val newObj = JSONObject().apply {
                put(KEY_TITLE, DEFAULT_TITLE)
                put(KEY_IS_RUNNING, true)
                put(KEY_START_TIME_MS, System.currentTimeMillis())
                put(KEY_TOTAL_ELAPSED_MS, 0L)
            }
            mmkv.encode(KEY_HOUR_CALCULATION, newObj.toString())
        }
    }

    private fun isStopwatchRunning(context: Context): Boolean {
        MMKV.initialize(context)
        val mmkv = MMKV.mmkvWithID(MMKV_ID) ?: return false
        val json = mmkv.decodeString(KEY_HOUR_CALCULATION) ?: return false
        return try {
            JSONObject(json).optBoolean(KEY_IS_RUNNING, false)
        } catch (e: Exception) {
            false
        }
    }

    private fun defaultJson(): String {
        return JSONObject().apply {
            put(KEY_TITLE, DEFAULT_TITLE)
            put(KEY_IS_RUNNING, false)
            put(KEY_START_TIME_MS, 0L)
            put(KEY_TOTAL_ELAPSED_MS, 0L)
        }.toString()
    }

    companion object {
        const val ACTION_TOGGLE = "app.until.time.TOGGLE_HOUR_CALCULATION"
        const val MMKV_ID = "until-storage"
        const val KEY_HOUR_CALCULATION = "hour.calculation.widget"
        private const val KEY_TITLE = "title"
        private const val KEY_IS_RUNNING = "isRunning"
        private const val KEY_START_TIME_MS = "startTimeMs"
        private const val KEY_TOTAL_ELAPSED_MS = "totalElapsedMs"
        private const val DEFAULT_TITLE = "Hour timer"
    }
}
