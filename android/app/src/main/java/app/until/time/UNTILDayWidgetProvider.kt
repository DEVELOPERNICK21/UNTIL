package app.until.time

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.os.Bundle

class UNTILDayWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        UNTILWidgetWorker.updateWidgets(context)
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle,
    ) {
        UNTILWidgetWorker.updateWidgets(context)
    }

    override fun onEnabled(context: Context) {
        UNTILWidgetWorker.schedule(context)
        UNTILWidgetWorker.scheduleDayTick(context)
    }
}
