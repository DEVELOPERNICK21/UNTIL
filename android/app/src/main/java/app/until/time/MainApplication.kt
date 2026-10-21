package app.until.time

import android.app.Application
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.tencent.mmkv.MMKV

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(UNTILWidgetPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    MMKV.initialize(this)
    loadReactNative(this)
    scheduleWidgetWork()
  }

  /**
   * First use of WorkManager opens its database, which is slow on a cold start. Doing it here on
   * the main thread showed up as ANRs, and nothing below needs to finish before the UI appears.
   */
  private fun scheduleWidgetWork() {
    val context = this
    Thread {
      UNTILWidgetWorker.schedule(context)
      WorkManager.getInstance(context)
        .enqueue(OneTimeWorkRequestBuilder<UNTILWidgetWorker>().build())
      UNTILWidgetWorker.scheduleDailyMidnight(context)
    }.start()
  }
}
