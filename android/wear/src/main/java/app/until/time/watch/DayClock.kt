package app.until.time.watch

import java.util.Calendar

/**
 * Day % from the watch clock — works offline without phone sync.
 * Phone Data Layer / MessageClient is optional and updates [DayWearStore] for extras.
 */
object DayClock {
    fun snapshot(nowMs: Long = System.currentTimeMillis()): DayWearCache {
        val cal = Calendar.getInstance()
        cal.timeInMillis = nowMs
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        val startOfDay = cal.timeInMillis
        cal.add(Calendar.DAY_OF_YEAR, 1)
        val endOfDay = cal.timeInMillis

        val total = (endOfDay - startOfDay).toDouble().coerceAtLeast(1.0)
        val elapsed = (nowMs - startOfDay).toDouble().coerceIn(0.0, total)
        val remainingMs = (endOfDay - nowMs).coerceAtLeast(0L)
        val progress = elapsed / total
        val percentDone = (progress * 100.0).toInt().coerceIn(0, 100)
        val percentLeft = (100 - percentDone).coerceIn(0, 100)
        val remainingMinutes = (remainingMs / 60_000L).toInt()

        return DayWearCache(
            dayProgress = progress,
            dayPercentDone = percentDone,
            dayPercentLeft = percentLeft,
            startOfDay = startOfDay,
            endOfDay = endOfDay,
            dayRemainingMinutes = remainingMinutes,
            dayHoursLeft = remainingMs / 3_600_000.0,
            updatedAt = nowMs,
        )
    }

    /** Tiny emotional line for Wear glance. */
    fun whisper(progress: Double): String {
        return when {
            progress < 0.15 -> "Fresh day"
            progress < 0.4 -> "Still ahead"
            progress < 0.65 -> "Hold steady"
            progress < 0.85 -> "Gentle close"
            else -> "Almost rest"
        }
    }
}
