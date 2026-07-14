package app.until.time.watch

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.google.android.gms.wearable.Wearable

/**
 * Wear Day detail — live Day % from the watch clock (no phone required).
 * Optionally requests a sync when a phone is paired.
 */
class DayActivity : Activity() {
    private lateinit var percentView: TextView
    private lateinit var leftView: TextView
    private lateinit var passedView: TextView
    private lateinit var footerView: TextView
    private lateinit var progressFill: View
    private lateinit var progressTrack: FrameLayout

    private val handler = Handler(Looper.getMainLooper())
    private val tickRunnable = object : Runnable {
        override fun run() {
            bind()
            handler.postDelayed(this, 1000L)
        }
    }

    private val refreshReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            bind()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val density = resources.displayMetrics.density
        fun dp(v: Int) = (v * density).toInt()

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#0E0E10"))
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            setPadding(dp(18), dp(14), dp(18), dp(14))
        }

        TextView(this).apply {
            text = "TODAY"
            setTextColor(Color.parseColor("#9A9A9A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            letterSpacing = 0.14f
            root.addView(this)
        }

        percentView = TextView(this).apply {
            setTextColor(Color.parseColor("#E87C20"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 42f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            root.addView(
                this,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                ).apply { topMargin = dp(2) },
            )
        }

        TextView(this).apply {
            text = "of the day passed"
            setTextColor(Color.parseColor("#9A9A9A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            gravity = Gravity.CENTER
            root.addView(this)
        }

        progressTrack = FrameLayout(this).apply {
            background = GradientDrawable().apply {
                cornerRadius = dp(5).toFloat()
                setColor(Color.parseColor("#AA2222"))
            }
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(10),
            ).apply {
                topMargin = dp(12)
                bottomMargin = dp(10)
            }
        }
        progressFill = View(this).apply {
            background = GradientDrawable().apply {
                cornerRadius = dp(5).toFloat()
                setColor(Color.parseColor("#22AA22"))
            }
            layoutParams = FrameLayout.LayoutParams(0, FrameLayout.LayoutParams.MATCH_PARENT)
        }
        progressTrack.addView(progressFill)
        root.addView(progressTrack)

        passedView = TextView(this).apply {
            setTextColor(Color.parseColor("#FF6B6B"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            gravity = Gravity.CENTER
            root.addView(this)
        }

        leftView = TextView(this).apply {
            setTextColor(Color.parseColor("#34C759"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            root.addView(
                this,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                ).apply { topMargin = dp(4) },
            )
        }

        footerView = TextView(this).apply {
            setTextColor(Color.parseColor("#6A6A6A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            gravity = Gravity.CENTER
            root.addView(
                this,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                ).apply { topMargin = dp(14) },
            )
        }

        setContentView(root)
        bind()
        requestSyncFromPhone()
    }

    private fun requestSyncFromPhone() {
        Wearable.getNodeClient(this).connectedNodes
            .addOnSuccessListener { nodes ->
                val client = Wearable.getMessageClient(this)
                for (node in nodes) {
                    client.sendMessage(node.id, REQUEST_PATH, ByteArray(0))
                }
                footerView.text = if (nodes.isEmpty()) {
                    "Live on watch · pair phone for tiles push"
                } else {
                    "Live on watch · syncing phone…"
                }
            }
            .addOnFailureListener {
                footerView.text = "Live on watch"
            }
    }

    override fun onStart() {
        super.onStart()
        val filter = IntentFilter(ACTION_REFRESH)
        if (Build.VERSION.SDK_INT >= 33) {
            ContextCompat.registerReceiver(
                this,
                refreshReceiver,
                filter,
                ContextCompat.RECEIVER_NOT_EXPORTED,
            )
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            registerReceiver(refreshReceiver, filter)
        }
        handler.removeCallbacks(tickRunnable)
        handler.post(tickRunnable)
        requestSyncFromPhone()
    }

    override fun onStop() {
        handler.removeCallbacks(tickRunnable)
        try {
            unregisterReceiver(refreshReceiver)
        } catch (_: Exception) {
        }
        super.onStop()
    }

    private fun bind() {
        val cache = DayClock.snapshot()
        // Keep local cache warm for tile/complication readers
        DayWearStore.save(this, cache)

        percentView.text = "${cache.dayPercentDone}%"
        leftView.text = detailedLeft(cache)
        passedView.text = detailedPassed(cache)
        footerView.text = DayClock.whisper(cache.dayProgress)
        setProgress(cache.progressClamped)
    }

    private fun detailedLeft(cache: DayWearCache): String {
        val end = cache.endOfDay ?: return cache.timeLeftText()
        val remainingSec = maxOf(0, ((end - System.currentTimeMillis()) / 1000L).toInt())
        val h = remainingSec / 3600
        val m = (remainingSec % 3600) / 60
        val s = remainingSec % 60
        return "${h}h ${m}m ${s}s left"
    }

    private fun detailedPassed(cache: DayWearCache): String {
        val start = cache.startOfDay ?: return ""
        val passedSec = maxOf(0, ((System.currentTimeMillis() - start) / 1000L).toInt())
        val h = passedSec / 3600
        val m = (passedSec % 3600) / 60
        val s = passedSec % 60
        return "${h}h ${m}m ${s}s passed"
    }

    private fun setProgress(fraction: Float) {
        progressTrack.post {
            val width = (progressTrack.width * fraction.coerceIn(0f, 1f)).toInt()
            val lp = progressFill.layoutParams as FrameLayout.LayoutParams
            lp.width = width
            progressFill.layoutParams = lp
        }
    }

    companion object {
        const val ACTION_REFRESH = "app.until.time.watch.DAY_REFRESH"
        const val REQUEST_PATH = "/until/day/request"
    }
}
