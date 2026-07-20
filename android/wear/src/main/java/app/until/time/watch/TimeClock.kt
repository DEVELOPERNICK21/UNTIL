package app.until.time.watch

import java.util.Calendar

object TimeClock {
    fun day(nowMs: Long = System.currentTimeMillis()): PeriodSnapshot {
        val cal = Calendar.getInstance()
        cal.timeInMillis = nowMs
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        val startMs = cal.timeInMillis
        cal.add(Calendar.DAY_OF_YEAR, 1)
        val endMs = cal.timeInMillis

        val total = (endMs - startMs).toDouble().coerceAtLeast(1.0)
        val elapsed = (nowMs - startMs).toDouble().coerceIn(0.0, total)
        val progress = elapsed / total
        val percentDone = (progress * 100.0).toInt().coerceIn(0, 100)
        val percentLeft = (100 - percentDone).coerceIn(0, 100)

        val remainingSec = maxOf(0, ((endMs - nowMs) / 1000L).toInt())
        val rh = remainingSec / 3600
        val rm = (remainingSec % 3600) / 60
        val rs = remainingSec % 60
        val remainingLabel = "${rh}h ${rm}m ${rs}s left"

        val passedSec = maxOf(0, ((nowMs - startMs) / 1000L).toInt())
        val ph = passedSec / 3600
        val pm = (passedSec % 3600) / 60
        val ps = passedSec % 60
        val passedLabel = "${ph}h ${pm}m ${ps}s passed"

        return PeriodSnapshot(
            progress = progress,
            percentDone = percentDone,
            percentLeft = percentLeft,
            startMs = startMs,
            endMs = endMs,
            remainingLabel = remainingLabel,
            passedLabel = passedLabel,
            whisper = whisperFor(progress),
            updatedAt = nowMs,
        )
    }

    fun month(nowMs: Long = System.currentTimeMillis()): PeriodSnapshot {
        val cal = Calendar.getInstance()
        cal.timeInMillis = nowMs
        val dayOfMonth = cal.get(Calendar.DAY_OF_MONTH)
        val daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH)

        cal.set(Calendar.DAY_OF_MONTH, 1)
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        val startMs = cal.timeInMillis
        cal.add(Calendar.MONTH, 1)
        val endMs = cal.timeInMillis

        val progress = (dayOfMonth - 1).toDouble() / daysInMonth
        val percentDone = (progress * 100.0).toInt().coerceIn(0, 100)
        val percentLeft = (100 - percentDone).coerceIn(0, 100)
        val remainingDays = daysInMonth - dayOfMonth

        return PeriodSnapshot(
            progress = progress,
            percentDone = percentDone,
            percentLeft = percentLeft,
            startMs = startMs,
            endMs = endMs,
            remainingLabel = "${remainingDays} days left",
            passedLabel = "Day $dayOfMonth of $daysInMonth",
            whisper = whisperFor(progress),
            updatedAt = nowMs,
        )
    }

    fun year(nowMs: Long = System.currentTimeMillis()): PeriodSnapshot {
        val cal = Calendar.getInstance()
        cal.timeInMillis = nowMs
        val dayOfYear = cal.get(Calendar.DAY_OF_YEAR)
        val daysInYear = cal.getActualMaximum(Calendar.DAY_OF_YEAR)

        cal.set(Calendar.DAY_OF_YEAR, 1)
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        val startMs = cal.timeInMillis
        cal.add(Calendar.YEAR, 1)
        val endMs = cal.timeInMillis

        val progress = dayOfYear.toDouble() / daysInYear
        val percentDone = (progress * 100.0).toInt().coerceIn(0, 100)
        val percentLeft = (100 - percentDone).coerceIn(0, 100)
        val remainingDays = daysInYear - dayOfYear

        return PeriodSnapshot(
            progress = progress,
            percentDone = percentDone,
            percentLeft = percentLeft,
            startMs = startMs,
            endMs = endMs,
            remainingLabel = "${remainingDays} days left",
            passedLabel = "Day $dayOfYear of $daysInYear",
            whisper = whisperFor(progress),
            updatedAt = nowMs,
        )
    }

    /** Tiny emotional line for Wear glance. */
    fun whisperFor(progress: Double): String {
        return when {
            progress < 0.15 -> "Fresh day"
            progress < 0.4 -> "Still ahead"
            progress < 0.65 -> "Hold steady"
            progress < 0.85 -> "Gentle close"
            else -> "Almost rest"
        }
    }
}
