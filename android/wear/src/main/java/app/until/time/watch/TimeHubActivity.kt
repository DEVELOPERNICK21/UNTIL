package app.until.time.watch

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
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

        val density = resources.displayMetrics.density
        fun dp(value: Int) = (value * density).toInt()

        pages = List(TimePage.entries.size) { TimePeriodPageView(this) }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0E0E10"))
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }
        val pager = ViewPager2(this).apply {
            adapter = TimeHubPagerAdapter { page -> pages[page.ordinal] }
            setCurrentItem(TimePage.DAY.ordinal, false)
        }
        root.addView(
            pager,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f,
            ),
        )

        val dotsRow = LinearLayout(this).apply {
            gravity = Gravity.CENTER
            orientation = LinearLayout.HORIZONTAL
        }
        dots = List(TimePage.entries.size) { index ->
            View(this).apply {
                layoutParams = LinearLayout.LayoutParams(dp(6), dp(6)).apply {
                    marginStart = dp(3)
                    marginEnd = dp(3)
                    bottomMargin = dp(10)
                }
                setDotActive(index == TimePage.DAY.ordinal)
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
                dots.forEachIndexed { index, dot -> dot.setDotActive(index == position) }
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

    private fun View.setDotActive(active: Boolean) {
        background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor(if (active) "#E87C20" else "#6A6A6A"))
        }
    }

    companion object {
        const val ACTION_REFRESH = "app.until.time.watch.DAY_REFRESH"
        const val REQUEST_PATH = "/until/day/request"
    }
}
