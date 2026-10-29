package app.until.time

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

/** "Next deadlines": the three nearest, as a list. A Premium widget. */
class UNTILDeadlinesWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        UNTILWidgetWorker.updateWidgets(context)
    }

    override fun onEnabled(context: Context) {
        UNTILWidgetWorker.schedule(context)
    }
}
