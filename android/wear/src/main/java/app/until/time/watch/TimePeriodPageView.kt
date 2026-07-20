package app.until.time.watch

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

class TimePeriodPageView(context: Context) : LinearLayout(context) {
    private val percentView: TextView
    private val subtitleView: TextView
    private val progressTrack: FrameLayout
    private val progressFill: View
    private val passedView: TextView
    private val leftView: TextView
    private val footerView: TextView

    init {
        val density = resources.displayMetrics.density
        fun dp(value: Int) = (value * density).toInt()

        orientation = VERTICAL
        gravity = Gravity.CENTER
        setBackgroundColor(Color.parseColor("#0E0E10"))
        setPadding(dp(18), dp(14), dp(18), dp(14))

        addView(TextView(context).apply {
            tag = "label"
            setTextColor(Color.parseColor("#9A9A9A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            letterSpacing = 0.14f
        })

        percentView = TextView(context).apply {
            setTextColor(Color.parseColor("#E87C20"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 42f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        }
        addView(
            percentView,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                topMargin = dp(2)
            },
        )

        subtitleView = TextView(context).apply {
            setTextColor(Color.parseColor("#9A9A9A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            gravity = Gravity.CENTER
        }
        addView(subtitleView)

        progressTrack = FrameLayout(context).apply {
            background = GradientDrawable().apply {
                cornerRadius = dp(5).toFloat()
                setColor(Color.parseColor("#AA2222"))
            }
        }
        progressFill = View(context).apply {
            background = GradientDrawable().apply {
                cornerRadius = dp(5).toFloat()
                setColor(Color.parseColor("#22AA22"))
            }
            layoutParams = FrameLayout.LayoutParams(0, FrameLayout.LayoutParams.MATCH_PARENT)
        }
        progressTrack.addView(progressFill)
        addView(
            progressTrack,
            LayoutParams(LayoutParams.MATCH_PARENT, dp(10)).apply {
                topMargin = dp(12)
                bottomMargin = dp(10)
            },
        )

        passedView = TextView(context).apply {
            setTextColor(Color.parseColor("#FF6B6B"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            gravity = Gravity.CENTER
        }
        addView(passedView)

        leftView = TextView(context).apply {
            setTextColor(Color.parseColor("#34C759"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        }
        addView(
            leftView,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                topMargin = dp(4)
            },
        )

        footerView = TextView(context).apply {
            setTextColor(Color.parseColor("#6A6A6A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            gravity = Gravity.CENTER
        }
        addView(
            footerView,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                topMargin = dp(14)
            },
        )
    }

    fun bind(label: String, snapshot: PeriodSnapshot?, emptyMessage: String? = null) {
        (getChildAt(0) as TextView).text = label
        if (snapshot == null) {
            percentView.text = "—"
            subtitleView.text = emptyMessage.orEmpty()
            progressTrack.visibility = INVISIBLE
            passedView.visibility = GONE
            leftView.visibility = GONE
            footerView.visibility = GONE
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
        progressTrack.visibility = VISIBLE
        passedView.visibility = VISIBLE
        leftView.visibility = VISIBLE
        footerView.visibility = VISIBLE
        passedView.text = snapshot.passedLabel
        leftView.text = snapshot.remainingLabel
        footerView.text = snapshot.whisper
        setProgress(snapshot.progressClamped)
    }

    private fun setProgress(fraction: Float) {
        progressTrack.post {
            val layoutParams = progressFill.layoutParams as FrameLayout.LayoutParams
            layoutParams.width = (progressTrack.width * fraction.coerceIn(0f, 1f)).toInt()
            progressFill.layoutParams = layoutParams
        }
    }
}
