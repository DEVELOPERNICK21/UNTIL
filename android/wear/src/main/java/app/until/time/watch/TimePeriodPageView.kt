package app.until.time.watch

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.core.graphics.ColorUtils
import androidx.core.widget.TextViewCompat
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Time Hub page — detailed dial: title, %, bar with tip glow, remaining.
 * Restores the previous detailed chrome; bar fill animates and tip pulses lightly.
 */
class TimePeriodPageView(context: Context) : ScrollView(context) {
    private val content: LinearLayout
    private val labelView: TextView
    private val percentView: TextView
    private val subtitleView: TextView
    private val progressTrack: FrameLayout
    private val progressFill: View
    private val progressTip: View
    private val tipHalo: View
    private val passedView: TextView
    private val leftView: TextView
    private val largeFont: Boolean
    private val extraLargeFont: Boolean
    private val motionEnabled: Boolean
    private var fillAnimator: ValueAnimator? = null
    private var pulseAnimator: ValueAnimator? = null
    private var lastProgress: Float? = null
    private var displayFraction = 0f

    init {
        val metrics = resources.displayMetrics
        val config = resources.configuration
        fun dp(value: Float) = (value * metrics.density).toInt()

        largeFont = WearLayoutMetrics.isLargeFont(config)
        extraLargeFont = WearLayoutMetrics.isExtraLargeFont(config)
        motionEnabled = Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE,
            1f,
        ) > 0f

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

        val barHeight = dp(10f)
        progressTrack = FrameLayout(context).apply {
            clipChildren = false
            clipToPadding = false
            background = GradientDrawable().apply {
                cornerRadius = dp(5f).toFloat()
                setColor(Color.parseColor("#AA2222"))
            }
            importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
            isClickable = true
            setOnClickListener {
                if (!motionEnabled) return@setOnClickListener
                animate().cancel()
                animate().scaleX(1.04f).scaleY(1.08f).setDuration(120L).withEndAction {
                    animate().scaleX(1f).scaleY(1f).setDuration(130L).start()
                }.start()
            }
        }
        progressFill = View(context).apply {
            background = GradientDrawable().apply {
                cornerRadius = dp(5f).toFloat()
                setColor(Color.parseColor("#22AA22"))
            }
            layoutParams = FrameLayout.LayoutParams(0, FrameLayout.LayoutParams.MATCH_PARENT)
        }
        tipHalo = View(context).apply {
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(ColorUtils.setAlphaComponent(Color.parseColor("#22AA22"), 90))
            }
            visibility = GONE
            layoutParams = FrameLayout.LayoutParams(dp(18f), dp(18f)).apply {
                gravity = Gravity.CENTER_VERTICAL or Gravity.START
            }
        }
        progressTip = View(context).apply {
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#22AA22"))
            }
            visibility = GONE
            layoutParams = FrameLayout.LayoutParams(dp(10f), dp(10f)).apply {
                gravity = Gravity.CENTER_VERTICAL or Gravity.START
            }
        }
        progressTrack.addView(progressFill)
        progressTrack.addView(tipHalo)
        progressTrack.addView(progressTip)
        content.addView(
            progressTrack,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                barHeight,
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
            stopPulse()
            return
        }

        percentView.text = "${snapshot.percentDone}%"
        percentView.setTextColor(ProgressColor.argb(snapshot.progressClamped))
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

        val progress = snapshot.progressClamped
        val color = ProgressColor.argb(progress)
        (progressFill.background as? GradientDrawable)?.setColor(color)
        (progressTip.background as? GradientDrawable)?.setColor(color)

        val first = lastProgress == null
        val changed = lastProgress?.let { abs(it - progress) >= 0.0005f } != false
        if (first || changed) {
            lastProgress = progress
            setProgress(progress, animate = motionEnabled && (first || changed))
        }
        if (motionEnabled && progress > 0.001f) startPulse() else stopPulse()
        post { scrollTo(0, 0) }
    }

    private fun compactLabel(raw: String): String {
        if (!largeFont) return raw
        return raw.replace(Regex("""\s+\d+s"""), "")
    }

    private fun setProgress(fraction: Float, animate: Boolean) {
        val target = fraction.coerceIn(0f, 1f)
        fillAnimator?.cancel()
        progressTrack.post {
            val full = progressTrack.width
            if (full <= 0) {
                progressTrack.post { setProgress(target, animate) }
                return@post
            }
            fun applyWidth(f: Float) {
                displayFraction = f
                val w = (full * f).roundToInt()
                val lp = progressFill.layoutParams as FrameLayout.LayoutParams
                lp.width = w
                progressFill.layoutParams = lp
                positionTip(w, full)
            }
            if (!animate || !motionEnabled) {
                applyWidth(target)
                return@post
            }
            val from = if (displayFraction <= 0.001f) 0f else displayFraction
            fillAnimator = ValueAnimator.ofFloat(from, target).apply {
                duration = 450L
                interpolator = DecelerateInterpolator()
                addUpdateListener { applyWidth(it.animatedValue as Float) }
                start()
            }
        }
    }

    private fun positionTip(fillWidth: Int, trackWidth: Int) {
        if (fillWidth <= 0 || displayFraction < 0.001f) {
            progressTip.visibility = GONE
            tipHalo.visibility = GONE
            return
        }
        progressTip.visibility = VISIBLE
        tipHalo.visibility = VISIBLE
        val tipSize = (progressTip.layoutParams as FrameLayout.LayoutParams).width
        val haloSize = (tipHalo.layoutParams as FrameLayout.LayoutParams).width
        val tipX = max(0, fillWidth - tipSize / 2).coerceAtMost(trackWidth - tipSize)
        val haloX = max(0, fillWidth - haloSize / 2).coerceAtMost(trackWidth - haloSize)
        (progressTip.layoutParams as FrameLayout.LayoutParams).marginStart = tipX
        (tipHalo.layoutParams as FrameLayout.LayoutParams).marginStart = haloX
        progressTip.requestLayout()
        tipHalo.requestLayout()
    }

    private fun startPulse() {
        if (pulseAnimator?.isRunning == true) return
        pulseAnimator?.cancel()
        pulseAnimator = ValueAnimator.ofFloat(0.85f, 1.15f).apply {
            duration = 1200L
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            addUpdateListener {
                val s = it.animatedValue as Float
                tipHalo.scaleX = s
                tipHalo.scaleY = s
                tipHalo.alpha = 0.35f + 0.35f * ((s - 0.85f) / 0.30f)
            }
            start()
        }
    }

    private fun stopPulse() {
        pulseAnimator?.cancel()
        pulseAnimator = null
        tipHalo.scaleX = 1f
        tipHalo.scaleY = 1f
        tipHalo.alpha = 1f
    }

    override fun onDetachedFromWindow() {
        fillAnimator?.cancel()
        stopPulse()
        super.onDetachedFromWindow()
    }

    override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(visibility)
        if (visibility != VISIBLE) {
            stopPulse()
        } else if (motionEnabled && (lastProgress ?: 0f) > 0.001f) {
            startPulse()
        }
    }
}
