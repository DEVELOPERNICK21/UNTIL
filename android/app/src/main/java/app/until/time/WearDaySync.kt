package app.until.time

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import org.json.JSONObject

/**
 * Pushes Day % fields to a paired Wear OS watch.
 * Uses MessageClient (works across phone/watch package names) and Data Layer as a secondary path.
 */
object WearDaySync {
    const val PATH = "/until/day"
    private const val TAG = "WearDaySync"

    fun push(
        context: Context,
        dayProgress: Double,
        dayPercentDone: Int,
        dayPercentLeft: Int,
        startOfDay: Long? = null,
        endOfDay: Long? = null,
        dayRemainingMinutes: Int? = null,
        birthDate: String? = null,
        deathAge: Int? = null,
    ) {
        try {
            val hoursLeft = when {
                dayRemainingMinutes != null -> dayRemainingMinutes / 60.0
                else -> dayPercentLeft / 100.0 * 24.0
            }
            val jsonObj = JSONObject()
                .put("dayProgress", dayProgress)
                .put("dayPercentDone", dayPercentDone)
                .put("dayPercentLeft", dayPercentLeft)
                .put("startOfDay", startOfDay)
                .put("endOfDay", endOfDay)
                .put("dayRemainingMinutes", dayRemainingMinutes)
                .put("dayHoursLeft", hoursLeft)
                .put("updatedAt", System.currentTimeMillis())
            if (!birthDate.isNullOrBlank()) {
                jsonObj.put("birthDate", birthDate)
                deathAge?.let { jsonObj.put("deathAge", it) }
            }
            val json = jsonObj.toString()
            val payload = json.toByteArray(Charsets.UTF_8)
            val appContext = context.applicationContext

            // Primary: MessageClient — works when Wear appId != phone appId
            Wearable.getNodeClient(appContext).connectedNodes
                .addOnSuccessListener { nodes ->
                    Log.i(TAG, "Pushing Day to ${nodes.size} wear node(s)")
                    val messageClient = Wearable.getMessageClient(appContext)
                    for (node in nodes) {
                        messageClient.sendMessage(node.id, PATH, payload)
                            .addOnSuccessListener {
                                Log.i(TAG, "Message sent to ${node.displayName}")
                            }
                            .addOnFailureListener { e ->
                                Log.w(TAG, "Message failed for ${node.displayName}", e)
                            }
                    }
                    if (nodes.isEmpty()) {
                        Log.w(TAG, "No connected Wear nodes — pair phone ↔ watch first")
                    }
                }
                .addOnFailureListener { e ->
                    Log.w(TAG, "connectedNodes failed", e)
                }

            // Secondary: Data Layer (same package / some companion setups)
            val request = PutDataMapRequest.create(PATH).apply {
                dataMap.putString("json", json)
                dataMap.putDouble("dayProgress", dayProgress)
                dataMap.putInt("dayPercentDone", dayPercentDone)
                dataMap.putInt("dayPercentLeft", dayPercentLeft)
                startOfDay?.let { dataMap.putLong("startOfDay", it) }
                endOfDay?.let { dataMap.putLong("endOfDay", it) }
                dayRemainingMinutes?.let { dataMap.putInt("dayRemainingMinutes", it) }
                dataMap.putDouble("dayHoursLeft", hoursLeft)
                dataMap.putLong("updatedAt", System.currentTimeMillis())
                if (!birthDate.isNullOrBlank()) {
                    dataMap.putString("birthDate", birthDate)
                    deathAge?.let { dataMap.putInt("deathAge", it) }
                }
            }.asPutDataRequest().setUrgent()
            Wearable.getDataClient(appContext).putDataItem(request)
        } catch (e: Exception) {
            Log.w(TAG, "WearDaySync.push failed", e)
        }
    }
}
