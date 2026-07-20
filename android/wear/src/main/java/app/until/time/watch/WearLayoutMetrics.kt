package app.until.time.watch

import android.content.res.Configuration
import android.util.DisplayMetrics

/**
 * Wear OS layout helpers for Play quality WO-V1 / WO-V14 / WO-V16.
 */
object WearLayoutMetrics {
    const val ESSENTIAL_SP = 12f
    const val NON_ESSENTIAL_SP = 10f
    const val BODY_SP = 13f
    const val PERCENT_MAX_SP = 36f
    const val PERCENT_MIN_SP = 18f
    const val PERCENT_MAX_SP_LARGE = 26f
    const val PERCENT_MAX_SP_EXTRA = 20f

    /** Keep clear of the round edge without eating half the dial. */
    const val EDGE_INSET_FRACTION = 0.10f

    fun insetPx(sizePx: Int, fraction: Float = EDGE_INSET_FRACTION): Int {
        return (sizePx * fraction).toInt().coerceAtLeast(8)
    }

    fun horizontalInsetPx(metrics: DisplayMetrics): Int = insetPx(metrics.widthPixels)

    fun verticalInsetPx(metrics: DisplayMetrics): Int = insetPx(metrics.heightPixels, 0.06f)

    fun isLargeFont(configuration: Configuration): Boolean = configuration.fontScale >= 1.15f

    fun isExtraLargeFont(configuration: Configuration): Boolean = configuration.fontScale >= 1.3f

    fun percentMaxSp(configuration: Configuration): Float = when {
        isExtraLargeFont(configuration) -> PERCENT_MAX_SP_EXTRA
        isLargeFont(configuration) -> PERCENT_MAX_SP_LARGE
        else -> PERCENT_MAX_SP
    }

    /**
     * Compact page-indicator hit area. Full 40dp targets on a 4-dot row steal
     * too much of a round Wear dial (blank half-screen). Visual dots stay 6dp.
     */
    fun pageDotTouchDp(configuration: Configuration): Float = when {
        isExtraLargeFont(configuration) -> 14f
        isLargeFont(configuration) -> 16f
        else -> 18f
    }

    fun pageDotVisualDp(configuration: Configuration): Float = 6f
}
