package app.until.time.watch

import android.content.ComponentName
import android.content.Intent
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import org.json.JSONObject

/**
 * Receives Day cache from the phone (MessageClient + Data Layer) and refreshes tile / complications.
 */
class DayDataListenerService : WearableListenerService() {
    override fun onMessageReceived(messageEvent: MessageEvent) {
        if (messageEvent.path != DayWearStore.PATH) return
        val json = runCatching {
            String(messageEvent.data, Charsets.UTF_8)
        }.getOrNull() ?: return
        applyJson(json)
    }

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        dataEvents.use { events ->
            for (event in events) {
                if (event.type != DataEvent.TYPE_CHANGED) continue
                val path = event.dataItem.uri.path ?: continue
                if (path != DayWearStore.PATH) continue

                val map = DataMapItem.fromDataItem(event.dataItem).dataMap
                val json = map.getString("json")
                if (!json.isNullOrBlank()) {
                    applyJson(json)
                    continue
                }
                DayWearStore.saveFromDataMap(
                    context = this,
                    dayProgress = map.getDouble("dayProgress", 0.0),
                    dayPercentDone = map.getInt("dayPercentDone", 0),
                    dayPercentLeft = map.getInt("dayPercentLeft", 100),
                    startOfDay = if (map.containsKey("startOfDay")) map.getLong("startOfDay") else null,
                    endOfDay = if (map.containsKey("endOfDay")) map.getLong("endOfDay") else null,
                    dayRemainingMinutes = if (map.containsKey("dayRemainingMinutes")) {
                        map.getInt("dayRemainingMinutes")
                    } else null,
                    dayHoursLeft = map.getDouble("dayHoursLeft", 0.0),
                    updatedAt = map.getLong("updatedAt", System.currentTimeMillis()),
                )
                notifyUi()
            }
        }
    }

    private fun applyJson(json: String) {
        try {
            val o = JSONObject(json)
            DayWearStore.saveFromDataMap(
                context = this,
                dayProgress = o.optDouble("dayProgress", 0.0),
                dayPercentDone = o.optInt("dayPercentDone", 0),
                dayPercentLeft = o.optInt("dayPercentLeft", 100),
                startOfDay = if (o.has("startOfDay") && !o.isNull("startOfDay")) o.getLong("startOfDay") else null,
                endOfDay = if (o.has("endOfDay") && !o.isNull("endOfDay")) o.getLong("endOfDay") else null,
                dayRemainingMinutes = if (o.has("dayRemainingMinutes") && !o.isNull("dayRemainingMinutes")) {
                    o.getInt("dayRemainingMinutes")
                } else null,
                dayHoursLeft = o.optDouble("dayHoursLeft", 0.0),
                updatedAt = o.optLong("updatedAt", System.currentTimeMillis()),
            )
            notifyUi()
        } catch (_: Exception) {
            // ignore bad payloads
        }
    }

    private fun notifyUi() {
        TileService.getUpdater(this).requestUpdate(DayTileService::class.java)
        ComplicationDataSourceUpdateRequester
            .create(this, ComponentName(this, DayComplicationService::class.java))
            .requestUpdateAll()
        sendBroadcast(Intent(DayActivity.ACTION_REFRESH).setPackage(packageName))
    }
}
