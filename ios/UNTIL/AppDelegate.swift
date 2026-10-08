import UIKit
import os
import FirebaseCore
import React
import React_RCTAppDelegate
import RCTLinking
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  private var reactNativeStarted = false
  private var launchOptionsForDeferredStart: [UIApplication.LaunchOptionsKey: Any]?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    window = UIWindow(frame: UIScreen.main.bounds)

    WatchConnectivityBridge.start()

    // A Dynamic Island button wakes the app in the background just to run its intent.
    // Nothing needs Firebase or JavaScript then, so skip that boot and the island answers
    // right away. It all starts as soon as the user really opens the app.
    if application.applicationState == .background {
      launchOptionsForDeferredStart = launchOptions
      Logger(subsystem: "com.developernick.until", category: "island")
        .debug("background launch, React Native deferred")
      return true
    }

    startReactNativeIfNeeded(launchOptions: launchOptions)
    return true
  }

  func applicationDidBecomeActive(_ application: UIApplication) {
    startReactNativeIfNeeded(launchOptions: launchOptionsForDeferredStart)
    launchOptionsForDeferredStart = nil
  }

  // `until://open/<Screen>` links from the Dynamic Island, Lock Screen card and widgets.
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    if !reactNativeStarted {
      // The app was only woken for an island button. Boot React Native with the link so
      // Linking.getInitialURL() sees it.
      launchOptionsForDeferredStart = nil
      startReactNativeIfNeeded(launchOptions: [.url: url])
      return true
    }
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }

  private func startReactNativeIfNeeded(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    guard !reactNativeStarted else { return }
    reactNativeStarted = true

    // Required for @react-native-firebase with use_frameworks! :static.
    // JS getApp() throws if the default FIRApp was never configured.
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    factory.startReactNative(
      withModuleName: "UNTIL",
      in: window,
      launchOptions: launchOptions
    )
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
