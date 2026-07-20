package app.until.time.watch

import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView

enum class TimePage { DAY, MONTH, YEAR, LIFE }

class TimeHubPagerAdapter(
    private val inflatePage: (TimePage) -> TimePeriodPageView,
) : RecyclerView.Adapter<TimeHubPagerAdapter.PageViewHolder>() {
    class PageViewHolder(page: TimePeriodPageView) : RecyclerView.ViewHolder(page)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PageViewHolder {
        return PageViewHolder(inflatePage(TimePage.entries[viewType]))
    }

    override fun onBindViewHolder(holder: PageViewHolder, position: Int) = Unit

    override fun getItemCount() = TimePage.entries.size

    override fun getItemViewType(position: Int) = position
}
