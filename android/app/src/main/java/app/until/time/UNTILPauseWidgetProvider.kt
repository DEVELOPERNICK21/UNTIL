package app.until.time

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.widget.RemoteViews
import java.util.Calendar

/**
 * Breathe: today's calm minutes as a ring, the level, this week's dots, and a tap that starts the
 * one-minute quick calm.
 *
 * Counts only (see [PauseGlance]), so nothing private shows on a home screen. The app reads
 * `until://open/PauseNow` (src/app/navigation/deepLinks.ts) and goes straight to breathing. The widget
 * is redrawn whenever the app records a session (WidgetBridge.updateWidgets) and at midnight, when
 * "today" and the week dots roll over.
 */
class UNTILPauseWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        refresh(context)
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle,
    ) {
        refresh(context)
    }

    companion object {
        /** Distinct from the request codes in UNTILWidgetWorker so the system never merges the intents. */
        private const val REQUEST_CODE = 9100
        private const val ACCENT = 0xFF7FE6DA.toInt()
        private const val WARM = 0xFFF2C48D.toInt()
        private const val TRACK = 0x2EFFFFFF
        private const val TEXT = 0xFFEAF6F4.toInt()

        /** True when at least one Breathe widget is on a home screen. */
        fun isPlaced(context: Context): Boolean =
            AppWidgetManager.getInstance(context)
                .getAppWidgetIds(ComponentName(context, UNTILPauseWidgetProvider::class.java)).isNotEmpty()

        fun refresh(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, UNTILPauseWidgetProvider::class.java))
            if (ids.isEmpty()) return
            val views = buildViews(context, PauseGlance.load(context), Calendar.getInstance())
            for (id in ids) manager.updateAppWidget(id, views)
        }

        internal fun buildViews(context: Context, glance: PauseGlance, now: Calendar): RemoteViews {
            val minutes = glance.todayMinutes(now)
            val goal = glance.goalMinutes
            val reached = glance.goalReached(now)
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
                setImageViewBitmap(R.id.pause_ring, ringBitmap(minutes, glance.progress(now), reached))
                setImageViewBitmap(R.id.pause_week, weekBitmap(glance.week(now), glance.todayIndex(now)))
                setTextViewText(R.id.pause_summary, "$minutes of $goal min today")
                setTextViewText(R.id.pause_level, glance.levelName)
                setTextColor(R.id.pause_summary, if (reached) WARM else TEXT)
                setContentDescription(
                    R.id.widget_root,
                    "Breathe. $minutes of $goal calm minutes today. Level ${glance.levelName}. Starts one minute of slow breathing."
                )
                setOnClickPendingIntent(R.id.widget_root, pending)
            }
        }

        private fun ringBitmap(minutes: Int, progress: Float, reached: Boolean): Bitmap {
            val size = 240
            val stroke = 20f
            val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            val inset = stroke / 2 + 2
            val box = RectF(inset, inset, size - inset, size - inset)
            val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = stroke
                strokeCap = Paint.Cap.ROUND
                color = TRACK
            }
            canvas.drawArc(box, 0f, 360f, false, paint)
            if (progress > 0f) {
                paint.color = if (reached) WARM else ACCENT
                canvas.drawArc(box, -90f, 360f * maxOf(progress, 0.02f), false, paint)
            }
            val text = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = TEXT
                textSize = 92f
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                textAlign = Paint.Align.CENTER
            }
            canvas.drawText(minutes.toString(), size / 2f, size / 2f + 32f, text)
            return bitmap
        }

        private fun weekBitmap(week: BooleanArray, todayIndex: Int): Bitmap {
            val radius = 12f
            val gap = 14f
            val width = (7 * radius * 2 + 6 * gap).toInt() + 4
            val height = (radius * 2).toInt() + 6
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            val fill = Paint(Paint.ANTI_ALIAS_FLAG)
            val ring = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = 3f
                color = Color.WHITE
            }
            for (i in 0 until 7) {
                val cx = 2 + radius + i * (radius * 2 + gap)
                val cy = height / 2f
                fill.color = if (week[i]) ACCENT else TRACK
                canvas.drawCircle(cx, cy, radius, fill)
                if (i == todayIndex) canvas.drawCircle(cx, cy, radius, ring)
            }
            return bitmap
        }
    }
}
