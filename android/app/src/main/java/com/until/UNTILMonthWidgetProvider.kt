package com.until

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

class UNTILMonthWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        UNTILWidgetWorker.updateWidgets(context)
    }

    override fun onEnabled(context: Context) {
        UNTILWidgetWorker.schedule(context)
    }
}
