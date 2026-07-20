package app.until.time.watch

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.core.widget.TextViewCompat

/**
 * Time Hub page — fills the dial and centers content; scrolls only when needed.
 * No mood whisper footer (kept for tiles only historically; removed from hub UI).
 */
class TimePeriodPageView(context: Context) : ScrollView(context) {
    private val content: LinearLayout
    private val labelView: TextView
    private val percentView: TextView
    private val subtitleView: TextView
    private val progressTrack: FrameLayout
    private val progressFill: View
    private val passedView: TextView
    private val leftView: TextView
    private val largeFont: Boolean
    private val extraLargeFont: Boolean

    init {
        val metrics = resources.displayMetrics
        val config = resources.configuration
        fun dp(value: Float) = (value * metrics.density).toInt()

        largeFont = WearLayoutMetrics.isLargeFont(config)
        extraLargeFont = WearLayoutMetrics.isExtraLargeFont(config)

        val hInset = WearLayoutMetrics.horizontalInsetPx(metrics)
        val vInset = WearLayoutMetrics.verticalInsetPx(metrics)
        val percentMax = WearLayoutMetrics.percentMaxSp(config)

        isFillViewport = true
        isVerticalScrollBarEnabled = true
        isScrollbarFadingEnabled = false
        overScrollMode = OVER_SCROLL_IF_CONTENT_SCROLLS
        clipToPadding = true
        isNestedScrollingEnabled = true
        setPadding(hInset, vInset, hInset, vInset)
        scrollBarStyle = SCROLLBARS_OUTSIDE_OVERLAY

        content = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#0E0E10"))
            setPadding(dp(2f), dp(2f), dp(2f), dp(2f))
        }

        labelView = TextView(context).apply {
            tag = "label"
            setTextColor(Color.parseColor("#9A9A9A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, WearLayoutMetrics.ESSENTIAL_SP)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            letterSpacing = 0.08f
            maxLines = 2
        }
        content.addView(
            labelView,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ),
        )

        percentView = TextView(context).apply {
            setTextColor(Color.parseColor("#E87C20"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            maxLines = 1
            TextViewCompat.setAutoSizeTextTypeUniformWithConfiguration(
                this,
                WearLayoutMetrics.PERCENT_MIN_SP.toInt(),
                percentMax.toInt(),
                1,
                TypedValue.COMPLEX_UNIT_SP,
            )
        }
        content.addView(
            percentView,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply {
                topMargin = dp(2f)
                height = TypedValue.applyDimension(
                    TypedValue.COMPLEX_UNIT_SP,
                    percentMax + 2f,
                    metrics,
                ).toInt()
            },
        )

        subtitleView = TextView(context).apply {
            setTextColor(Color.parseColor("#9A9A9A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, WearLayoutMetrics.ESSENTIAL_SP)
            gravity = Gravity.CENTER
            maxLines = 2
            visibility = if (extraLargeFont) GONE else VISIBLE
        }
        content.addView(
            subtitleView,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ),
        )

        progressTrack = FrameLayout(context).apply {
            background = GradientDrawable().apply {
                cornerRadius = dp(5f).toFloat()
                setColor(Color.parseColor("#AA2222"))
            }
            importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
        }
        progressFill = View(context).apply {
            background = GradientDrawable().apply {
                cornerRadius = dp(5f).toFloat()
                setColor(Color.parseColor("#22AA22"))
            }
            layoutParams = FrameLayout.LayoutParams(0, FrameLayout.LayoutParams.MATCH_PARENT)
        }
        progressTrack.addView(progressFill)
        content.addView(
            progressTrack,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(8f),
            ).apply {
                topMargin = dp(8f)
                bottomMargin = dp(6f)
            },
        )

        passedView = TextView(context).apply {
            setTextColor(Color.parseColor("#FF6B6B"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, WearLayoutMetrics.ESSENTIAL_SP)
            gravity = Gravity.CENTER
            maxLines = 2
        }
        content.addView(
            passedView,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ),
        )

        leftView = TextView(context).apply {
            setTextColor(Color.parseColor("#34C759"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, WearLayoutMetrics.BODY_SP)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            maxLines = 2
        }
        content.addView(
            leftView,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply {
                topMargin = dp(2f)
            },
        )

        addView(
            content,
            LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.WRAP_CONTENT,
            ),
        )
        setBackgroundColor(Color.parseColor("#0E0E10"))

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            isFocusable = true
            isFocusableInTouchMode = true
        }
    }

    fun bind(label: String, snapshot: PeriodSnapshot?, emptyMessage: String? = null) {
        labelView.text = label
        if (snapshot == null) {
            percentView.text = "—"
            subtitleView.text = emptyMessage.orEmpty()
            subtitleView.visibility = VISIBLE
            progressTrack.visibility = INVISIBLE
            passedView.visibility = GONE
            leftView.visibility = GONE
            return
        }

        percentView.text = "${snapshot.percentDone}%"
        subtitleView.text = when (label) {
            "TODAY" -> "of the day passed"
            "THIS MONTH" -> "of the month passed"
            "THIS YEAR" -> "of the year passed"
            "LIFE" -> "of life passed"
            else -> "of $label passed"
        }
        if (!extraLargeFont) {
            subtitleView.visibility = VISIBLE
        }
        progressTrack.visibility = VISIBLE
        passedView.visibility = VISIBLE
        leftView.visibility = VISIBLE
        passedView.text = compactLabel(snapshot.passedLabel)
        leftView.text = compactLabel(snapshot.remainingLabel)
        setProgress(snapshot.progressClamped)
        post { scrollTo(0, 0) }
    }

    private fun compactLabel(raw: String): String {
        if (!largeFont) return raw
        return raw.replace(Regex("""\s+\d+s"""), "")
    }

    private fun setProgress(fraction: Float) {
        progressTrack.post {
            val layoutParams = progressFill.layoutParams as FrameLayout.LayoutParams
            layoutParams.width = (progressTrack.width * fraction.coerceIn(0f, 1f)).toInt()
            progressFill.layoutParams = layoutParams
        }
    }
}
