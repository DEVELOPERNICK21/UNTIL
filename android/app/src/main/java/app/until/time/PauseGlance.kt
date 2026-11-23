package app.until.time

import android.content.Context
import org.json.JSONObject
import java.util.Calendar
import java.util.Locale

/**
 * Pause at a glance, for the Breathe widget and the overlay's Calm view: calm seconds per recent
 * date, the daily goal and the level. Counts only, never how anyone felt. The app writes it under
 * `pause.glance` (features/widgets/data/WidgetSync.ts) keyed by date, so a widget that has not been
 * refreshed since yesterday still reads the right day. The rules mirror features/pause/domain
 * (calmMinutes, goalReached, weekDays, levels); PauseGlanceTest-style checks live in the Jest suite.
 */
data class PauseGlance(
    val recent: Map<String, Int>,
    val goalSeconds: Int,
    val level: String,
) {
    private fun key(day: Calendar): String =
        String.format(Locale.US, "%04d-%02d-%02d", day.get(Calendar.YEAR), day.get(Calendar.MONTH) + 1, day.get(Calendar.DAY_OF_MONTH))

    fun secondsOn(day: Calendar): Int = recent[key(day)] ?: 0

    val goalMinutes: Int get() = maxOf(1, goalSeconds / 60)

    fun todayMinutes(now: Calendar = Calendar.getInstance()): Int = minutes(secondsOn(now))

    fun goalReached(now: Calendar = Calendar.getInstance()): Boolean = todayMinutes(now) >= goalMinutes

    /** Same as the app's ring: full once the goal is reached, otherwise the exact share of the goal. */
    fun progress(now: Calendar = Calendar.getInstance()): Float =
        if (goalReached(now)) 1f else minOf(1f, secondsOn(now).toFloat() / goalSeconds)

    /** The seven days of this week, Monday first: true where something was practised. */
    fun week(now: Calendar = Calendar.getInstance()): BooleanArray {
        val start = now.clone() as Calendar
        start.add(Calendar.DAY_OF_YEAR, -todayIndex(now))
        return BooleanArray(7) { i ->
            val day = start.clone() as Calendar
            day.add(Calendar.DAY_OF_YEAR, i)
            secondsOn(day) >= MIN_COUNTED_SECONDS
        }
    }

    /** Index of today in [week], Monday = 0. */
    fun todayIndex(now: Calendar = Calendar.getInstance()): Int = (now.get(Calendar.DAY_OF_WEEK) + 5) % 7

    val levelName: String
        get() = when (level) {
            "steady" -> "Steady"
            "still" -> "Still"
            "deep" -> "Deep"
            "tranquil" -> "Tranquil"
            else -> "Settling"
        }

    companion object {
        const val STORAGE_KEY = "pause.glance"
        /** A practice shorter than this does not count towards a dot (same as the app). */
        const val MIN_COUNTED_SECONDS = 20
        val EMPTY = PauseGlance(emptyMap(), 180, "settling")

        /** Minutes to show: the nearest whole minute, but never 0 for time that really was practised. */
        fun minutes(seconds: Int): Int =
            if (seconds <= 0) 0 else maxOf(1, Math.round(seconds / 60f))

        fun parse(json: String?): PauseGlance {
            if (json.isNullOrBlank()) return EMPTY
            return try {
                val obj = JSONObject(json)
                val recentObj = obj.optJSONObject("recent")
                val recent = HashMap<String, Int>()
                recentObj?.keys()?.forEach { k -> recent[k] = recentObj.optInt(k, 0) }
                PauseGlance(recent, maxOf(60, obj.optInt("goalSeconds", 180)), obj.optString("level", "settling"))
            } catch (e: Exception) {
                EMPTY
            }
        }

        fun load(context: Context): PauseGlance =
            parse(UntilMmkv.storage(context)?.decodeString(STORAGE_KEY))
    }
}
