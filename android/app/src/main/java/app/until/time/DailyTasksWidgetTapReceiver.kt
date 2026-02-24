package app.until.time

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Toggles the Daily Tasks widget page (Tasks vs Day) and refreshes the widget.
 * Tap the widget to flip between "Today's tasks" and "Day progress".
 */
class DailyTasksWidgetTapReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_TOGGLE_PAGE) return
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val current = prefs.getInt(KEY_PAGE, 0)
        val next = 1 - current
        prefs.edit().putInt(KEY_PAGE, next).apply()
        UNTILWidgetWorker.updateWidgets(context)
    }

    companion object {
        const val ACTION_TOGGLE_PAGE = "app.until.time.TOGGLE_DAILY_TASKS_PAGE"
        const val PREFS_NAME = "until_widget_prefs"
        const val KEY_PAGE = "daily_tasks_widget_page"
    }
}
