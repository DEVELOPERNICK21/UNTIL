package app.until.time.watch

/**
 * Day % from the watch clock — works offline without phone sync.
 * Phone Data Layer / MessageClient is optional and updates [DayWearStore] for extras.
 */
object DayClock {
    fun snapshot(nowMs: Long = System.currentTimeMillis()): DayWearCache {
        val p = TimeClock.day(nowMs)
        return DayWearCache(
            dayProgress = p.progress,
            dayPercentDone = p.percentDone,
            dayPercentLeft = p.percentLeft,
            startOfDay = p.startMs,
            endOfDay = p.endMs,
            dayRemainingMinutes = ((p.endMs ?: nowMs) - nowMs).coerceAtLeast(0L).div(60_000L).toInt(),
            dayHoursLeft = ((p.endMs ?: nowMs) - nowMs).coerceAtLeast(0L) / 3_600_000.0,
            updatedAt = p.updatedAt,
        )
    }

    fun whisper(progress: Double): String = TimeClock.whisperFor(progress)
}
