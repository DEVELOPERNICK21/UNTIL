package app.until.time.watch

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.InsetDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import androidx.core.content.ContextCompat
import androidx.viewpager2.widget.ViewPager2
import com.google.android.gms.wearable.Wearable

class TimeHubActivity : Activity() {
    private lateinit var pages: List<TimePeriodPageView>
    private lateinit var dots: List<View>
    private val handler = Handler(Looper.getMainLooper())
    private val tickRunnable = object : Runnable {
        override fun run() {
            rebindAll()
            handler.postDelayed(this, 1000L)
        }
    }
    private val refreshReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) = rebindAll()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val metrics = resources.displayMetrics
        val config = resources.configuration
        val edgeInset = WearLayoutMetrics.horizontalInsetPx(metrics)
        fun dp(value: Float) = (value * metrics.density).toInt()

        pages = List(TimePage.entries.size) { TimePeriodPageView(this) }

        // Vertical stack (not overlay): pager + dots. Overlay caused text-on-dots
        // which fails Wear font / layout quality (WO-V1).
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0E0E10"))
            // Small chin pad only — large bottomInset left a blank band under the dial.
            setPadding(0, 0, 0, dp(4f))
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }

        val pager = ViewPager2(this).apply {
            adapter = TimeHubPagerAdapter { page -> pages[page.ordinal] }
            setCurrentItem(TimePage.DAY.ordinal, false)
            offscreenPageLimit = 1
        }
        root.addView(
            pager,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f,
            ),
        )

        val touch = dp(WearLayoutMetrics.pageDotTouchDp(config))
        val visual = dp(WearLayoutMetrics.pageDotVisualDp(config))
        val inset = ((touch - visual) / 2).coerceAtLeast(0)

        val dotsRow = LinearLayout(this).apply {
            gravity = Gravity.CENTER
            orientation = LinearLayout.HORIZONTAL
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
            setPadding(edgeInset, dp(2f), edgeInset, dp(2f))
        }
        dots = List(TimePage.entries.size) { index ->
            View(this).apply {
                layoutParams = LinearLayout.LayoutParams(touch, touch).apply {
                    marginStart = dp(1f)
                    marginEnd = dp(1f)
                }
                setDotActive(active = index == TimePage.DAY.ordinal, insetPx = inset)
            }.also(dotsRow::addView)
        }
        root.addView(
            dotsRow,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ),
        )

        pager.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
            override fun onPageSelected(position: Int) {
                dots.forEachIndexed { index, dot ->
                    dot.setDotActive(active = index == position, insetPx = inset)
                }
            }
        })

        setContentView(root)
        rebindAll()
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

    private fun rebindAll() {
        pages[TimePage.DAY.ordinal].bind("TODAY", TimeClock.day())
        pages[TimePage.MONTH.ordinal].bind("THIS MONTH", TimeClock.month())
        pages[TimePage.YEAR.ordinal].bind("THIS YEAR", TimeClock.year())
        pages[TimePage.LIFE.ordinal].bind(
            "LIFE",
            LifeClock.snapshot(ProfileStore.load(this)),
            emptyMessage = "Open UNTIL on phone",
        )
    }

    private fun requestSyncFromPhone() {
        Wearable.getNodeClient(this).connectedNodes
            .addOnSuccessListener { nodes ->
                val client = Wearable.getMessageClient(this)
                nodes.forEach { node ->
                    client.sendMessage(node.id, REQUEST_PATH, ByteArray(0))
                }
            }
    }

    private fun View.setDotActive(active: Boolean, insetPx: Int) {
        val fill = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor(if (active) "#E87C20" else "#6A6A6A"))
        }
        background = InsetDrawable(fill, insetPx)
    }

    companion object {
        const val ACTION_REFRESH = "app.until.time.watch.DAY_REFRESH"
        const val REQUEST_PATH = "/until/day/request"
    }
}
