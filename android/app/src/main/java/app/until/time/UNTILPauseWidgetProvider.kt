package app.until.time

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

/**
 * Pause: one button that starts the one-minute quick calm.
 *
 * It shows nothing that changes (no minutes, no feelings), so it has no timer, no worker and reads no
 * stored data. The app reads `until://open/PauseNow` (see src/app/navigation/deepLinks.ts) and goes
 * straight to breathing, skipping the hub.
 */
class UNTILPauseWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) {
            appWidgetManager.updateAppWidget(id, buildViews(context))
        }
    }

    private fun buildViews(context: Context): RemoteViews {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("until://open/PauseNow"), context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pending = PendingIntent.getActivity(
            context,
            REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return RemoteViews(context.packageName, R.layout.widget_pause).apply {
            setOnClickPendingIntent(R.id.widget_root, pending)
        }
    }

    private companion object {
        /** Distinct from the request codes in UNTILWidgetWorker so the system never merges the intents. */
        const val REQUEST_CODE = 9100
    }
}
