import UIKit
import os
import FirebaseCore
import React
import React_RCTAppDelegate
import RCTLinking
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  private var reactNativeStarted = false

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    WatchConnectivityBridge.start()
    // The window and React Native start when the first scene connects (see SceneDelegate).
    // A Dynamic Island button that wakes the app in the background never creates a scene, so
    // Firebase and JavaScript stay off and the island answers right away.
    return true
  }

  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }

  /// Boots React Native into the scene's window. Safe to call more than once.
  func startReactNativeIfNeeded(
    in window: UIWindow,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) {
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

/// iOS 27 requires apps to use the scene lifecycle: an app that makes its window in the AppDelegate
/// and has no scene manifest hangs on its launch screen. The window is made here, from the scene.
@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  private var appDelegate: AppDelegate? { UIApplication.shared.delegate as? AppDelegate }
  private var launchOptionsForDeferredStart: [UIApplication.LaunchOptionsKey: Any]?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    window = UIWindow(windowScene: windowScene)

    // `until://open/<Screen>` links from the Dynamic Island, Lock Screen card and widgets, and
    // web links, arrive here when the app is opened by them. Hand the first one to React Native
    // so Linking.getInitialURL() sees it.
    var launchOptions: [UIApplication.LaunchOptionsKey: Any] = [:]
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions[.url] = url
    } else if let activity = connectionOptions.userActivities.first {
      launchOptions[.userActivityDictionary] = [
        UIApplication.LaunchOptionsKey.userActivityType: activity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": activity,
      ]
    }

    // A scene created while the app is still in the background (nothing on screen yet) waits
    // until it is really opened, as the old background-launch path did.
    if UIApplication.shared.applicationState == .background {
      launchOptionsForDeferredStart = launchOptions
      Logger(subsystem: "com.developernick.until", category: "island")
        .debug("background scene, React Native deferred")
      return
    }
    start(with: launchOptions)
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    guard let pending = launchOptionsForDeferredStart else { return }
    launchOptionsForDeferredStart = nil
    start(with: pending)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }

  private func start(with launchOptions: [UIApplication.LaunchOptionsKey: Any]) {
    guard let window else { return }
    appDelegate?.startReactNativeIfNeeded(in: window, launchOptions: launchOptions)
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
