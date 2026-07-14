package app.until.time

import android.util.Log
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService

/**
 * Watch opens DayActivity → sends /until/day/request → phone runs widget + WearDaySync push.
 */
class WearSyncRequestService : WearableListenerService() {
    override fun onMessageReceived(messageEvent: MessageEvent) {
        if (messageEvent.path != REQUEST_PATH) return
        Log.i(TAG, "Wear requested Day sync")
        try {
            UNTILWidgetWorker.updateWidgets(applicationContext)
        } catch (e: Exception) {
            Log.w(TAG, "Wear sync request failed", e)
        }
    }

    companion object {
        const val REQUEST_PATH = "/until/day/request"
        private const val TAG = "WearSyncRequest"
    }
}
