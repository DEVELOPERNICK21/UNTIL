package app.until.time.watch

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.DecelerateInterpolator
import androidx.core.graphics.ColorUtils
import kotlin.math.abs

class ProgressRingView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {
    private val trackColor = 0xFF2A2A2E.toInt()
    private val strokeDp = 11f
    private val oval = RectF()
    private var targetProgress = 0f
    private var displayProgress = 0f
    private var pulseT = 0f
    private var motionEnabled = true
    private var pulseActive = false
    private var fillAnimator: ValueAnimator? = null
    private var pulseAnimator: ValueAnimator? = null

    private val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        color = trackColor
    }
    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }
    private val tipPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val haloPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }

    init {
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
        isClickable = true
    }

    fun setMotionEnabled(enabled: Boolean) {
        if (enabled == motionEnabled) return
        motionEnabled = enabled
        if (!enabled) {
            pulseAnimator?.cancel()
            pulseAnimator = null
            fillAnimator?.cancel()
            fillAnimator = null
            displayProgress = targetProgress
            pulseT = 0f
            scaleX = 1f
            scaleY = 1f
            invalidate()
        } else if (canPulse()) {
            startPulse()
        }
    }

    fun setProgress(progress: Float, animate: Boolean) {
        val newTarget = progress.coerceIn(0f, 1f)
        if (abs(newTarget - targetProgress) < 0.0005f) return
        targetProgress = newTarget
        fillAnimator?.cancel()
        fillAnimator = null
        val reduce = !motionEnabled || !animate
        if (reduce) {
            displayProgress = targetProgress
            invalidate()
            return
        }
        animateFill(displayProgress, targetProgress)
    }

    fun playAppearAnimation() {
        fillAnimator?.cancel()
        fillAnimator = null
        if (!motionEnabled) {
            displayProgress = targetProgress
            invalidate()
            return
        }
        displayProgress = 0f
        invalidate()
        animateFill(0f, targetProgress)
    }

    fun setPulseActive(active: Boolean) {
        if (active == pulseActive) return
        pulseActive = active
        if (canPulse()) {
            startPulse()
        } else {
            stopPulse()
        }
    }

    private fun animateFill(from: Float, to: Float) {
        fillAnimator = ValueAnimator.ofFloat(from, to).apply {
            duration = 450L
            interpolator = DecelerateInterpolator()
            addUpdateListener {
                displayProgress = it.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (canPulse()) startPulse()
    }

    override fun onDetachedFromWindow() {
        stopPulse()
        fillAnimator?.cancel()
        fillAnimator = null
        super.onDetachedFromWindow()
    }

    override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(visibility)
        if (visibility == VISIBLE && canPulse()) {
            startPulse()
        } else {
            stopPulse()
        }
    }

    private fun canPulse(): Boolean =
        motionEnabled && pulseActive && isAttachedToWindow && windowVisibility == VISIBLE

    private fun startPulse() {
        if (pulseAnimator?.isRunning == true) return
        pulseAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 1200L
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener {
                pulseT = it.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    private fun stopPulse() {
        pulseAnimator?.cancel()
        pulseAnimator = null
        pulseT = 0f
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        val stroke = strokeDp * resources.displayMetrics.density
        trackPaint.strokeWidth = stroke
        fillPaint.strokeWidth = stroke
        val pad = stroke / 2f
        oval.set(pad, pad, width - pad, height - pad)
        canvas.drawOval(oval, trackPaint)

        val color = ProgressColor.argb(targetProgress)
        fillPaint.color = color
        val sweep = 360f * displayProgress
        if (sweep > 0.1f) {
            canvas.drawArc(oval, -90f, sweep, false, fillPaint)
        }

        if (displayProgress > 0.001f) {
            val cx = oval.centerX()
            val cy = oval.centerY()
            val r = oval.width() / 2f
            val rad = Math.toRadians((-90f + sweep).toDouble())
            val tx = cx + r * Math.cos(rad).toFloat()
            val ty = cy + r * Math.sin(rad).toFloat()
            val tipR = stroke * 0.48f
            val haloScale = 1f + 0.15f * pulseT
            val haloAlpha = 0.25f + 0.30f * pulseT
            haloPaint.color = ColorUtils.setAlphaComponent(color, (haloAlpha * 255).toInt())
            canvas.drawCircle(tx, ty, tipR * 2.2f * haloScale, haloPaint)
            tipPaint.color = color
            canvas.drawCircle(tx, ty, tipR, tipPaint)
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_UP && motionEnabled) {
            animate().cancel()
            animate().scaleX(1.06f).scaleY(1.06f).setDuration(120L).withEndAction {
                animate().scaleX(1f).scaleY(1f).setDuration(130L).start()
            }.start()
            performClick()
        }
        return super.onTouchEvent(event)
    }

    override fun performClick(): Boolean {
        super.performClick()
        return true
    }
}
