package app.until.time.watch

data class PeriodSnapshot(
    val progress: Double,
    val percentDone: Int,
    val percentLeft: Int,
    val startMs: Long?,
    val endMs: Long?,
    val remainingLabel: String,
    val passedLabel: String,
    val whisper: String,
    val updatedAt: Long,
) {
    val progressClamped: Float
        get() = progress.toFloat().coerceIn(0f, 1f)
}
