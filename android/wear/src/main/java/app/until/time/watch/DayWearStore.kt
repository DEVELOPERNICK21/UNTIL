package app.until.time.watch

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

data class DayWearCache(
    val dayProgress: Double,
    val dayPercentDone: Int,
    val dayPercentLeft: Int,
    val startOfDay: Long?,
    val endOfDay: Long?,
    val dayRemainingMinutes: Int?,
    val dayHoursLeft: Double,
    val updatedAt: Long,
) {
    fun timeLeftText(nowMs: Long = System.currentTimeMillis()): String {
        if (endOfDay != null) {
            val remainingSec = maxOf(0, ((endOfDay - nowMs) / 1000L).toInt())
            val h = remainingSec / 3600
            val m = (remainingSec % 3600) / 60
            return "${h}h ${m}m left"
        }
        if (dayRemainingMinutes != null) {
            val h = dayRemainingMinutes / 60
            val m = dayRemainingMinutes % 60
            return "${h}h ${m}m left"
        }
        return "${dayHoursLeft.toInt()}h left"
    }

    val progressClamped: Float
        get() = dayProgress.toFloat().coerceIn(0f, 1f)
}

object DayWearStore {
    const val PATH = "/until/day"
    private const val PREFS = "until_wear_day"
    private const val KEY_JSON = "day_json"

    private fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun load(context: Context): DayWearCache? {
        val raw = prefs(context).getString(KEY_JSON, null) ?: return null
        return try {
            fromJson(raw)
        } catch (_: Exception) {
            null
        }
    }

    fun save(context: Context, cache: DayWearCache) {
        prefs(context).edit().putString(KEY_JSON, toJson(cache)).apply()
    }

    fun saveFromDataMap(
        context: Context,
        dayProgress: Double,
        dayPercentDone: Int,
        dayPercentLeft: Int,
        startOfDay: Long?,
        endOfDay: Long?,
        dayRemainingMinutes: Int?,
        dayHoursLeft: Double,
        updatedAt: Long,
    ): DayWearCache {
        val cache = DayWearCache(
            dayProgress = dayProgress,
            dayPercentDone = dayPercentDone,
            dayPercentLeft = dayPercentLeft,
            startOfDay = startOfDay,
            endOfDay = endOfDay,
            dayRemainingMinutes = dayRemainingMinutes,
            dayHoursLeft = dayHoursLeft,
            updatedAt = updatedAt,
        )
        save(context, cache)
        return cache
    }

    private fun toJson(cache: DayWearCache): String {
        return JSONObject()
            .put("dayProgress", cache.dayProgress)
            .put("dayPercentDone", cache.dayPercentDone)
            .put("dayPercentLeft", cache.dayPercentLeft)
            .put("startOfDay", cache.startOfDay)
            .put("endOfDay", cache.endOfDay)
            .put("dayRemainingMinutes", cache.dayRemainingMinutes)
            .put("dayHoursLeft", cache.dayHoursLeft)
            .put("updatedAt", cache.updatedAt)
            .toString()
    }

    private fun fromJson(raw: String): DayWearCache {
        val o = JSONObject(raw)
        return DayWearCache(
            dayProgress = o.optDouble("dayProgress", 0.0),
            dayPercentDone = o.optInt("dayPercentDone", 0),
            dayPercentLeft = o.optInt("dayPercentLeft", 100),
            startOfDay = if (o.has("startOfDay") && !o.isNull("startOfDay")) o.getLong("startOfDay") else null,
            endOfDay = if (o.has("endOfDay") && !o.isNull("endOfDay")) o.getLong("endOfDay") else null,
            dayRemainingMinutes = if (o.has("dayRemainingMinutes") && !o.isNull("dayRemainingMinutes")) {
                o.getInt("dayRemainingMinutes")
            } else null,
            dayHoursLeft = o.optDouble("dayHoursLeft", 0.0),
            updatedAt = o.optLong("updatedAt", 0L),
        )
    }
}
