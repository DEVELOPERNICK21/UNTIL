package app.until.time.watch

import java.util.Calendar

object LifeClock {
    private const val MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000
    private const val DEFAULT_DEATH_AGE = 80

    fun snapshot(
        profile: ProfileStore.Profile?,
        nowMs: Long = System.currentTimeMillis(),
    ): PeriodSnapshot? {
        if (profile == null) return null
        val birthCal = parseBirthDate(profile.birthDate) ?: return null
        val deathAge = if (profile.deathAge <= 0) DEFAULT_DEATH_AGE else profile.deathAge

        val startMs = birthCal.timeInMillis
        val deathCal = (birthCal.clone() as Calendar).apply {
            add(Calendar.YEAR, deathAge)
        }
        val endMs = deathCal.timeInMillis

        val totalMs = (endMs - startMs).toDouble().coerceAtLeast(1.0)
        val elapsedMs = (nowMs - startMs).toDouble()

        val progress = when {
            elapsedMs <= 0 -> 0.0
            elapsedMs >= totalMs -> 1.0
            else -> (elapsedMs / totalMs).coerceIn(0.0, 1.0)
        }
        val percentDone = (progress * 100.0).toInt().coerceIn(0, 100)
        val percentLeft = (100 - percentDone).coerceIn(0, 100)

        val yearsLived = maxOf(0.0, elapsedMs / MS_PER_YEAR)
        val yearsLeft = maxOf(0.0, (endMs - nowMs).toDouble() / MS_PER_YEAR)

        return PeriodSnapshot(
            progress = progress,
            percentDone = percentDone,
            percentLeft = percentLeft,
            startMs = startMs,
            endMs = endMs,
            remainingLabel = "${yearsLeft.toInt()}y left",
            passedLabel = "${yearsLived.toInt()}y lived",
            whisper = TimeClock.whisperFor(progress),
            updatedAt = nowMs,
        )
    }

    private fun parseBirthDate(iso: String): Calendar? {
        val trimmed = iso.trim()
        if (trimmed.length < 10) return null
        val parts = trimmed.split("-")
        if (parts.size != 3) return null
        val year = parts[0].toIntOrNull() ?: return null
        val month = parts[1].toIntOrNull() ?: return null
        val day = parts[2].toIntOrNull() ?: return null
        if (month !in 1..12 || day !in 1..31) return null

        return Calendar.getInstance().apply {
            set(Calendar.YEAR, year)
            set(Calendar.MONTH, month - 1)
            set(Calendar.DAY_OF_MONTH, day)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
    }
}
