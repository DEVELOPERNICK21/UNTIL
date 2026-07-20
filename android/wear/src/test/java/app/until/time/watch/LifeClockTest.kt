package app.until.time.watch

import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar

class LifeClockTest {
    @Test
    fun null_profile_returns_null() {
        assertNull(LifeClock.snapshot(null))
    }

    @Test
    fun mid_life_near_50_for_age_40_of_80() {
        val birth = Calendar.getInstance().apply {
            add(Calendar.YEAR, -40)
        }
        val iso = String.format(
            "%04d-%02d-%02d",
            birth.get(Calendar.YEAR),
            birth.get(Calendar.MONTH) + 1,
            birth.get(Calendar.DAY_OF_MONTH),
        )
        val snap = LifeClock.snapshot(ProfileStore.Profile(iso, 80))
        assertNotNull(snap)
        assertTrue(snap!!.percentDone in 47..53)
    }
}
