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
 */
class DayTileService : TileService() {
    override fun onTileRequest(
        requestParams: RequestBuilders.TileRequest,
    ): ListenableFuture<TileBuilders.Tile> {
        val cache = DayClock.snapshot()
        DayWearStore.save(this, cache)
        val percentLabel = "${cache.dayPercentDone}%"
        val sub = DayClock.whisper(cache.dayProgress)
        val progressDeg = (cache.progressClamped * 360f).coerceIn(0f, 360f)

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

        fun text(value: String, sizeSp: Float, color: Int): LayoutElementBuilders.Text {
            return LayoutElementBuilders.Text.Builder()
                .setText(value)
                .setFontStyle(
                    LayoutElementBuilders.FontStyle.Builder()
                        .setSize(sp(sizeSp))
                        .setColor(argb(color))
                        .build(),
                )
                .setMaxLines(2)
                .build()
        }

        fun arcLine(lengthDeg: Float, color: Int, thickness: Float): LayoutElementBuilders.ArcLine {
            return LayoutElementBuilders.ArcLine.Builder()
                .setLength(degrees(lengthDeg))
                .setColor(argb(color))
                .setThickness(dp(thickness))
                .build()
        }

        val ring = LayoutElementBuilders.Box.Builder()
            .setWidth(dp(88f))
            .setHeight(dp(88f))
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
            .addContent(text(percentLabel, 22f, 0xFFEDEDED.toInt()))
            .build()

        val column = LayoutElementBuilders.Column.Builder()
            .setWidth(expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .addContent(text("DAY", 11f, 0xFF9A9A9A.toInt()))
            .addContent(LayoutElementBuilders.Spacer.Builder().setHeight(dp(6f)).build())
            .addContent(ring)
            .addContent(LayoutElementBuilders.Spacer.Builder().setHeight(dp(8f)).build())
            .addContent(text(sub, 12f, 0xFFE9A23A.toInt()))
            .addContent(LayoutElementBuilders.Spacer.Builder().setHeight(dp(4f)).build())
            .addContent(text(cache.timeLeftText(), 11f, 0xFF9A9A9A.toInt()))
            .build()

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
                            .setStart(dp(10f))
                            .setEnd(dp(10f))
                            .setTop(dp(10f))
                            .setBottom(dp(10f))
                            .build(),
                    )
                    .build(),
            )
            .addContent(column)
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
        private const val RESOURCES_VERSION = "3"
    }
}
