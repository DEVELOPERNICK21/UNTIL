package app.until.time

import android.content.Context
import com.tencent.mmkv.MMKV

/**
 * The one way the Android code opens the shared "until-storage" MMKV file that the React Native side
 * and the widgets both use.
 *
 * Why this exists: `MMKV.initialize()` is not thread safe. Its native half assigns a global
 * `std::string` (the temp directory) without a lock, so when two threads call it at once, both free
 * the same old buffer and Android's allocator aborts the process (SIGABRT in libmmkv.so, in
 * `operator delete`). The widget code used to call `initialize()` before every read, from several
 * WorkManager threads and receivers at once, and again while the app was starting. Only people with
 * a widget were affected, and the crash repeated on every update.
 *
 * So: initialize exactly once per process, under a lock, and open the storage through [storage].
 * Never call `MMKV.initialize()` anywhere else.
 */
object UntilMmkv {
    const val STORAGE_ID = "until-storage"

    private val initialization = RunOnce()

    /** Initializes MMKV the first time it is called in this process and does nothing afterwards. */
    fun ensureInitialized(context: Context) {
        initialization.run { MMKV.initialize(context.applicationContext) }
    }

    /** The shared storage, or null when MMKV cannot open it. Safe to call from any thread. */
    fun storage(context: Context): MMKV? {
        ensureInitialized(context)
        return MMKV.mmkvWithID(STORAGE_ID)
    }
}

/**
 * Runs a block at most once, however many threads ask at the same time. If the block throws it has
 * not run, so the next call tries again.
 */
internal class RunOnce {
    @Volatile
    private var done = false
    private val lock = Any()

    fun run(block: () -> Unit) {
        if (done) return
        synchronized(lock) {
            if (done) return
            block()
            done = true
        }
    }
}
