package app.until.time.watch

import android.content.res.Configuration
import android.util.DisplayMetrics
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WearLayoutMetricsTest {
    @Test
    fun essential_and_non_essential_meet_wo_v14_minimums() {
        assertTrue(WearLayoutMetrics.ESSENTIAL_SP >= 12f)
        assertTrue(WearLayoutMetrics.NON_ESSENTIAL_SP >= 10f)
        assertTrue(WearLayoutMetrics.BODY_SP >= WearLayoutMetrics.ESSENTIAL_SP)
    }

    @Test
    fun inset_is_percentage_of_screen_for_round_bezels() {
        assertEquals(20, WearLayoutMetrics.insetPx(200, 0.10f))
        assertEquals(8, WearLayoutMetrics.insetPx(20, 0.10f))
    }

    @Test
    fun horizontal_and_vertical_insets_use_display_metrics() {
        val metrics = DisplayMetrics().apply {
            widthPixels = 400
            heightPixels = 400
        }
        assertEquals(40, WearLayoutMetrics.horizontalInsetPx(metrics))
        assertEquals(24, WearLayoutMetrics.verticalInsetPx(metrics))
    }

    @Test
    fun large_font_thresholds_match_system_font_scale() {
        val normal = Configuration().apply { fontScale = 1.0f }
        val large = Configuration().apply { fontScale = 1.2f }
        val extra = Configuration().apply { fontScale = 1.35f }

        assertFalse(WearLayoutMetrics.isLargeFont(normal))
        assertTrue(WearLayoutMetrics.isLargeFont(large))
        assertTrue(WearLayoutMetrics.isExtraLargeFont(extra))
        assertFalse(WearLayoutMetrics.isExtraLargeFont(large))
    }

    @Test
    fun percent_max_shrinks_for_large_and_extra_large_font() {
        val normal = Configuration().apply { fontScale = 1.0f }
        val large = Configuration().apply { fontScale = 1.2f }
        val extra = Configuration().apply { fontScale = 1.35f }

        assertEquals(WearLayoutMetrics.PERCENT_MAX_SP, WearLayoutMetrics.percentMaxSp(normal))
        assertEquals(WearLayoutMetrics.PERCENT_MAX_SP_LARGE, WearLayoutMetrics.percentMaxSp(large))
        assertEquals(WearLayoutMetrics.PERCENT_MAX_SP_EXTRA, WearLayoutMetrics.percentMaxSp(extra))
    }

    @Test
    fun page_dots_stay_compact_so_dial_is_not_half_blank() {
        val normal = Configuration().apply { fontScale = 1.0f }
        assertTrue(WearLayoutMetrics.pageDotTouchDp(normal) <= 20f)
        assertTrue(WearLayoutMetrics.pageDotVisualDp(normal) <= 8f)
    }
}
