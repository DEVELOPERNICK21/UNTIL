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

  private override init() {
    super.init()
    cache = WatchDayStore.load()
    activate()
  }

  private func activate() {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    session.delegate = self
    session.activate()
  }

  private func apply(_ context: [String: Any]) {
    if let saved = WatchDayStore.save(fromContext: context) {
      DispatchQueue.main.async {
        self.cache = saved
      }
      WidgetCenter.shared.reloadAllTimelines()
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
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    apply(applicationContext)
  }
}
