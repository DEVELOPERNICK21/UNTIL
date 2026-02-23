package app.until.time

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.tencent.mmkv.MMKV
import org.json.JSONArray
import org.json.JSONObject

/** Receives widget tap: increments the counter in MMKV and updates the widget. Does not open the app. */
class CounterIncrementReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_INCREMENT) return
        val counterId = intent.getStringExtra(EXTRA_COUNTER_ID) ?: return
        val updated = incrementCounterInStorage(context, counterId)
        UNTILWidgetWorker.updateWidgets(context)
    }

    private fun incrementCounterInStorage(context: Context, counterId: String): Boolean {
        return try {
            MMKV.initialize(context)
            val mmkv = MMKV.mmkvWithID(MMKV_ID) ?: return false
            val json = mmkv.decodeString(CUSTOM_COUNTERS_KEY) ?: return false
            val arr = JSONArray(json)
            val newArr = JSONArray()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val id = obj.optString("id", "")
                val title = obj.optString("title", "Counter")
                var count = obj.optInt("count", 0)
                if (id == counterId) count += 1
                newArr.put(JSONObject().apply {
                    put("id", id)
                    put("title", title)
                    put("count", count)
                })
            }
            mmkv.encode(CUSTOM_COUNTERS_KEY, newArr.toString())
            true
        } catch (e: Exception) {
            false
        }
    }

    companion object {
        const val ACTION_INCREMENT = "app.until.time.INCREMENT_COUNTER"
        const val EXTRA_COUNTER_ID = "counter_id"
        private const val MMKV_ID = "until-storage"
        private const val CUSTOM_COUNTERS_KEY = "custom.counters"
    }
}
