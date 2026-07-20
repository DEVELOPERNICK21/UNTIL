package app.until.time.watch

import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView

enum class TimePage { DAY, MONTH, YEAR, LIFE }

class TimeHubPagerAdapter(
    private val inflatePage: (TimePage) -> TimePeriodPageView,
) : RecyclerView.Adapter<TimeHubPagerAdapter.PageViewHolder>() {
    class PageViewHolder(page: TimePeriodPageView) : RecyclerView.ViewHolder(page)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PageViewHolder {
        val page = inflatePage(TimePage.entries[viewType])
        page.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT,
        )
        return PageViewHolder(page)
    }

    override fun onBindViewHolder(holder: PageViewHolder, position: Int) = Unit

    override fun getItemCount() = TimePage.entries.size

    override fun getItemViewType(position: Int) = position
}
