package app.until.time.watch

import androidx.wear.watchface.complications.data.ComplicationData
import androidx.wear.watchface.complications.data.ComplicationType
import androidx.wear.watchface.complications.data.PlainComplicationText
import androidx.wear.watchface.complications.data.RangedValueComplicationData
import androidx.wear.watchface.complications.data.ShortTextComplicationData
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.SuspendingComplicationDataSourceService

/**
 * Watch-face complication: Day % (ranged + short text).
 */
class DayComplicationService : SuspendingComplicationDataSourceService() {
    override fun getPreviewData(type: ComplicationType): ComplicationData? {
        return when (type) {
            ComplicationType.SHORT_TEXT -> shortText(37, "DAY")
            ComplicationType.RANGED_VALUE -> ranged(37, 0.37f)
            else -> null
        }
    }

    override suspend fun onComplicationRequest(request: ComplicationRequest): ComplicationData? {
        val cache = DayClock.snapshot()
        DayWearStore.save(this, cache)
        val percent = cache.dayPercentDone
        val progress = cache.progressClamped
        return when (request.complicationType) {
            ComplicationType.SHORT_TEXT -> shortText(percent, "DAY")
            ComplicationType.RANGED_VALUE -> ranged(percent, progress)
            else -> shortText(percent, "DAY")
        }
    }

    private fun shortText(percent: Int, title: String): ComplicationData {
        return ShortTextComplicationData.Builder(
            text = PlainComplicationText.Builder("$percent%").build(),
            contentDescription = PlainComplicationText.Builder("Day $percent percent done").build(),
        )
            .setTitle(PlainComplicationText.Builder(title).build())
            .build()
    }

    private fun ranged(percent: Int, progress: Float): ComplicationData {
        return RangedValueComplicationData.Builder(
            value = progress * 100f,
            min = 0f,
            max = 100f,
            contentDescription = PlainComplicationText.Builder("Day $percent percent done").build(),
        )
            .setText(PlainComplicationText.Builder("$percent%").build())
            .setTitle(PlainComplicationText.Builder("DAY").build())
            .build()
    }
}
