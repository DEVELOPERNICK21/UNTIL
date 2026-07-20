package app.until.time.watch

import android.content.Context
import android.content.SharedPreferences

object ProfileStore {
    private const val PREFS = "until_wear_profile"
    private const val KEY_BIRTH_DATE = "birthDate"
    private const val KEY_DEATH_AGE = "deathAge"
    private const val DEFAULT_DEATH_AGE = 80

    data class Profile(val birthDate: String, val deathAge: Int)

    private fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun load(context: Context): Profile? {
        val birthDate = prefs(context).getString(KEY_BIRTH_DATE, null)?.trim().orEmpty()
        if (birthDate.isEmpty()) return null
        val deathAge = prefs(context).getInt(KEY_DEATH_AGE, DEFAULT_DEATH_AGE)
        return Profile(
            birthDate = birthDate,
            deathAge = if (deathAge <= 0) DEFAULT_DEATH_AGE else deathAge,
        )
    }

    fun save(context: Context, birthDate: String, deathAge: Int) {
        prefs(context).edit()
            .putString(KEY_BIRTH_DATE, birthDate)
            .putInt(KEY_DEATH_AGE, if (deathAge <= 0) DEFAULT_DEATH_AGE else deathAge)
            .apply()
    }
}
