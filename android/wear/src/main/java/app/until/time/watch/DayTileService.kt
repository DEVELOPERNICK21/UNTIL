package app.until.time.watch

import androidx.wear.protolayout.ActionBuilders
import androidx.wear.protolayout.ColorBuilders.argb
import androidx.wear.protolayout.DimensionBuilders.degrees
import androidx.wear.protolayout.DimensionBuilders.dp
import androidx.wear.protolayout.DimensionBuilders.expand
import androidx.wear.protolayout.DimensionBuilders.sp
import androidx.wear.protolayout.LayoutElementBuilders
import androidx.wear.protolayout.ModifiersBuilders
import androidx.wear.protolayout.TimelineBuilders
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

/**
 * Day % tile — circular glance (arc + %), tap opens [TimeHubActivity].
 *
 * Uses sp for all text (WO-V1). At large system font scales, drops secondary
 * lines and shrinks the ring so content is not clipped (WO-V1 / WO-V16).
 */
class DayTileService : TileService() {
    override fun onTileRequest(
        requestParams: RequestBuilders.TileRequest,
    ): ListenableFuture<TileBuilders.Tile> {
        val cache = DayClock.snapshot()
        DayWearStore.save(this, cache)
        val percentLabel = "${cache.dayPercentDone}%"
        val progressDeg = (cache.progressClamped * 360f).coerceIn(0f, 360f)
        val largeFont = WearLayoutMetrics.isLargeFont(resources.configuration)
        val extraLarge = WearLayoutMetrics.isExtraLargeFont(resources.configuration)

        val clickable = ModifiersBuilders.Clickable.Builder()
            .setId("open_day")
            .setOnClick(
                ActionBuilders.LaunchAction.Builder()
                    .setAndroidActivity(
                        ActionBuilders.AndroidActivity.Builder()
                            .setClassName(TimeHubActivity::class.java.name)
                            .setPackageName(packageName)
                            .build(),
                    )
                    .build(),
            )
            .build()

        fun text(value: String, sizeSp: Float, color: Int, maxLines: Int = 2): LayoutElementBuilders.Text {
            return LayoutElementBuilders.Text.Builder()
                .setText(value)
                .setFontStyle(
                    LayoutElementBuilders.FontStyle.Builder()
                        .setSize(sp(sizeSp))
                        .setColor(argb(color))
                        .build(),
                )
                .setMaxLines(maxLines)
                .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
                .build()
        }

        fun arcLine(lengthDeg: Float, color: Int, thickness: Float): LayoutElementBuilders.ArcLine {
            return LayoutElementBuilders.ArcLine.Builder()
                .setLength(degrees(lengthDeg))
                .setColor(argb(color))
                .setThickness(dp(thickness))
                .build()
        }

        val ringSize = when {
            extraLarge -> 64f
            largeFont -> 76f
            else -> 88f
        }
        // sp sizes scale with system font settings (WO-V1). Base is reduced only at
        // extra-large scales so the fixed tile slot still fits without clipping.
        val percentSp = when {
            extraLarge -> 18f
            largeFont -> 20f
            else -> 22f
        }.coerceAtLeast(WearLayoutMetrics.ESSENTIAL_SP)

        val ring = LayoutElementBuilders.Box.Builder()
            .setWidth(dp(ringSize))
            .setHeight(dp(ringSize))
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .addContent(
                LayoutElementBuilders.Arc.Builder()
                    .setAnchorAngle(degrees(-90f))
                    .setAnchorType(LayoutElementBuilders.ARC_ANCHOR_START)
                    .addContent(arcLine(360f, 0xFF2A2A2A.toInt(), 8f))
                    .build(),
            )
            .addContent(
                LayoutElementBuilders.Arc.Builder()
                    .setAnchorAngle(degrees(-90f))
                    .setAnchorType(LayoutElementBuilders.ARC_ANCHOR_START)
                    .addContent(arcLine(progressDeg, 0xFFE87C20.toInt(), 8f))
                    .build(),
            )
            .addContent(text(percentLabel, percentSp, 0xFFEDEDED.toInt(), maxLines = 1))
            .build()

        val column = LayoutElementBuilders.Column.Builder()
            .setWidth(expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .addContent(text("DAY", WearLayoutMetrics.ESSENTIAL_SP, 0xFF9A9A9A.toInt(), maxLines = 1))
            .addContent(LayoutElementBuilders.Spacer.Builder().setHeight(dp(if (largeFont) 4f else 6f)).build())
            .addContent(ring)

        if (!extraLarge) {
            column
                .addContent(LayoutElementBuilders.Spacer.Builder().setHeight(dp(6f)).build())
                .addContent(
                    text(
                        cache.timeLeftText(),
                        WearLayoutMetrics.ESSENTIAL_SP,
                        0xFF9A9A9A.toInt(),
                    ),
                )
        }

        val edgePad = if (largeFont) 14f else 10f
        val root = LayoutElementBuilders.Box.Builder()
            .setWidth(expand())
            .setHeight(expand())
            .setModifiers(
                ModifiersBuilders.Modifiers.Builder()
                    .setClickable(clickable)
                    .setBackground(
                        ModifiersBuilders.Background.Builder()
                            .setColor(argb(0xFF0E0E10.toInt()))
                            .build(),
                    )
                    .setPadding(
                        ModifiersBuilders.Padding.Builder()
                            .setStart(dp(edgePad))
                            .setEnd(dp(edgePad))
                            .setTop(dp(edgePad))
                            .setBottom(dp(edgePad))
                            .build(),
                    )
                    .build(),
            )
            .addContent(column.build())
            .build()

        return Futures.immediateFuture(
            TileBuilders.Tile.Builder()
                .setResourcesVersion(RESOURCES_VERSION)
                .setTileTimeline(TimelineBuilders.Timeline.fromLayoutElement(root))
                .setFreshnessIntervalMillis(60 * 1000L)
                .build(),
        )
    }

    companion object {
        private const val RESOURCES_VERSION = "4"
    }
}
