package app.until.time.watch

import org.junit.Assert.assertEquals
import org.junit.Test

class ProgressColorTest {
    @Test fun start_is_green() = assertEquals("#22C55E", ProgressColor.hex(0f))
    @Test fun mid_is_amber() = assertEquals("#F59E0B", ProgressColor.hex(0.5f))
    @Test fun end_is_red() = assertEquals("#EF4444", ProgressColor.hex(1f))
    @Test fun clamps_low() = assertEquals("#22C55E", ProgressColor.hex(-1f))
    @Test fun clamps_high() = assertEquals("#EF4444", ProgressColor.hex(2f))
    @Test fun quarter_hex() = assertEquals("#8CB235", ProgressColor.hex(0.25f))
}
