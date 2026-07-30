//
//  UNTILWatchApp.swift
//  UNTILWatch — Day detail on Apple Watch.
//

import SwiftUI
import WatchConnectivity
import WidgetKit

@main
struct UNTILWatchApp: App {
  @StateObject private var session = WatchSessionReceiver.shared

  var body: some Scene {
    WindowGroup {
      DayDetailView()
        .environmentObject(session)
    }
  }
}

final class WatchSessionReceiver: NSObject, ObservableObject, WCSessionDelegate {
  static let shared = WatchSessionReceiver()

  @Published var cache: DayWatchCache?
  @Published var profile: WatchProfile?

  private override init() {
    super.init()
    cache = WatchDayStore.load()
    profile = WatchProfileStore.load()
    activate()
  }

  private func activate() {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    session.delegate = self
    session.activate()
  }

  private func apply(_ context: [String: Any]) {
    WatchProfileStore.save(fromContext: context)
    let loadedProfile = WatchProfileStore.load()
    if let saved = WatchDayStore.save(fromContext: context) {
      DispatchQueue.main.async {
        self.cache = saved
        self.profile = loadedProfile
      }
      WidgetCenter.shared.reloadAllTimelines()
    } else {
      DispatchQueue.main.async {
        self.profile = loadedProfile
      }
    }
  }

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    if activationState == .activated, !session.receivedApplicationContext.isEmpty {
      apply(session.receivedApplicationContext)
    }
    if activationState == .activated, session.isReachable {
      session.sendMessage(["type": "until.watch.refresh"], replyHandler: { _ in }, errorHandler: { _ in })
    }
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    apply(applicationContext)
  }
}
