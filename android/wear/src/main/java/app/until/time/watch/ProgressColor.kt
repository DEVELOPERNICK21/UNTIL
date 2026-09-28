package app.until.time.watch

import android.graphics.Color
import kotlin.math.roundToInt

object ProgressColor {
    private val start = floatArrayOf(0x22 / 255f, 0xC5 / 255f, 0x5E / 255f)
    private val mid = floatArrayOf(0xF5 / 255f, 0x9E / 255f, 0x0B / 255f)
    private val end = floatArrayOf(0xEF / 255f, 0x44 / 255f, 0x44 / 255f)

    fun rgb(progress: Float): FloatArray {
        val p = progress.coerceIn(0f, 1f)
        val from: FloatArray
        val to: FloatArray
        val t: Float
        if (p <= 0.5f) {
            from = start; to = mid; t = p * 2f
        } else {
            from = mid; to = end; t = (p - 0.5f) * 2f
        }
        return floatArrayOf(
            from[0] + (to[0] - from[0]) * t,
            from[1] + (to[1] - from[1]) * t,
            from[2] + (to[2] - from[2]) * t,
        )
    }

    fun argb(progress: Float): Int {
        val c = rgb(progress)
        return Color.rgb(
            (c[0] * 255f).roundToInt(),
            (c[1] * 255f).roundToInt(),
            (c[2] * 255f).roundToInt(),
        )
    }

    fun hex(progress: Float): String {
        val c = rgb(progress)
        fun b(x: Float) = (x * 255f).roundToInt()
        return String.format("#%02X%02X%02X", b(c[0]), b(c[1]), b(c[2]))
    }
}
