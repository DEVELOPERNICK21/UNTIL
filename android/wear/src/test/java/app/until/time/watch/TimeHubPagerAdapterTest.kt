package app.until.time.watch

import org.junit.Assert.assertEquals
import org.junit.Test

class TimeHubPagerAdapterTest {
    @Test
    fun exposes_day_month_year_and_life_pages() {
        val adapter = TimeHubPagerAdapter { error("Pages are not created for item count") }

        assertEquals(4, adapter.itemCount)
        assertEquals(
            listOf(TimePage.DAY, TimePage.MONTH, TimePage.YEAR, TimePage.LIFE),
            TimePage.entries.toList(),
        )
    }
}
