package app.until.time

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Reschedules widget workers after reboot or app update so widgets recover without opening the app.
 */
class WidgetBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        when (intent?.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED -> {
                UNTILWidgetWorker.schedule(context)
                UNTILWidgetWorker.updateWidgets(context)
            }
        }
    }
}
