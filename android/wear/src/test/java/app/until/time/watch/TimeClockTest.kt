package app.until.time.watch

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class TimeClockTest {
    private fun ms(y: Int, month0: Int, day: Int, h: Int, m: Int, s: Int = 0): Long {
        val c = Calendar.getInstance(TimeZone.getDefault())
        c.set(y, month0, day, h, m, s)
        c.set(Calendar.MILLISECOND, 0)
        return c.timeInMillis
    }

    @Test
    fun day_at_noon_is_near_50_percent() {
        val snap = TimeClock.day(ms(2026, Calendar.JULY, 20, 12, 0))
        assertTrue(snap.percentDone in 49..51)
    }

    @Test
    fun month_on_first_is_zero() {
        val snap = TimeClock.month(ms(2026, Calendar.JULY, 1, 8, 0))
        assertEquals(0, snap.percentDone)
    }

    @Test
    fun year_on_jan_1_near_zero() {
        val snap = TimeClock.year(ms(2026, Calendar.JANUARY, 1, 1, 0))
        assertTrue(snap.percentDone <= 1)
    }
}
