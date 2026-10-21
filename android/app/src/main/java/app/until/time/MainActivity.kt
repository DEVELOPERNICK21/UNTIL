package app.until.time

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "UNTIL"

  /**
   * react-native-screens cannot restore its fragments after Android kills the process, and
   * crashes in ScreenFragment.<init> when it tries. React Native keeps screen state in JS, so
   * starting without the saved state is safe (the library's documented fix).
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
