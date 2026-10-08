//
//  UNTILWatchApp.swift
//  UNTILWatch — Time Hub on Apple Watch.
//

import Combine
import SwiftUI
import WatchConnectivity
import WidgetKit
import os

@main
struct UNTILWatchApp: App {
  @StateObject private var session = WatchSessionReceiver.shared

  var body: some Scene {
    WindowGroup {
      TimeHubView()
        .environmentObject(session)
    }
  }
}

final class WatchSessionReceiver: NSObject, ObservableObject, WCSessionDelegate {
  static let shared = WatchSessionReceiver()

  @Published var cache: DayWatchCache?
  @Published var profile: WatchProfile?
  /// Streak, tasks and the hour timer, as the phone last sent them.
  @Published var extras: WatchExtras = .empty
  /// A short line under the timer buttons when the phone could not be reached.
  @Published var notice: String?

  private override init() {
    super.init()
    cache = WatchDayStore.load()
    profile = WatchProfileStore.load()
    extras = WatchExtrasStore.load()
    #if DEBUG
    if ProcessInfo.processInfo.arguments.contains("-untilWatchDemo") {
      profile = WatchDemo.profile
      extras = WatchDemo.extras
      return
    }
    #endif
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
    let savedExtras = WatchExtrasStore.save(fromContext: context)
    let savedCache = WatchDayStore.save(fromContext: context)
    DispatchQueue.main.async {
      self.profile = loadedProfile
      if let savedExtras { self.extras = savedExtras }
      if let savedCache { self.cache = savedCache }
    }
    if savedCache != nil { WidgetCenter.shared.reloadAllTimelines() }
  }

  // MARK: Hour timer

  /// Asks the phone to start, pause or reset the timer. The phone owns the timer, so the
  /// island, the widget and the watch always agree.
  func timer(_ action: String) {
    guard WCSession.isSupported(), WCSession.default.activationState == .activated, WCSession.default.isReachable else {
      show(notice: "Open UNTIL on iPhone")
      return
    }
    WCSession.default.sendMessage(
      ["type": "until.watch.timer", "action": action],
      replyHandler: { [weak self] reply in
        guard let self else { return }
        let extras = WatchExtras.from(context: reply)
        guard let timer = extras.timer else { return }
        var next = self.extras
        next.timer = timer
        WatchExtrasStore.save(next)
        DispatchQueue.main.async { self.extras = next }
      },
      errorHandler: { [weak self] _ in
        self?.show(notice: "Phone didn't answer")
      }
    )
  }

  /// Adds or takes off one on the first counter. The phone keeps the count, so the widget and
  /// the app agree with the watch.
  func counter(id: String, change: Int) {
    guard WCSession.isSupported(), WCSession.default.activationState == .activated, WCSession.default.isReachable else {
      show(notice: "Open UNTIL on iPhone")
      return
    }
    WCSession.default.sendMessage(
      ["type": "until.watch.counter", "id": id, "change": change],
      replyHandler: { [weak self] reply in
        guard let self else { return }
        let counter = WatchExtras.from(context: reply).counter
        guard let counter else { return }
        var next = self.extras
        next.counter = counter
        WatchExtrasStore.save(next)
        DispatchQueue.main.async { self.extras = next }
      },
      errorHandler: { [weak self] _ in
        self?.show(notice: "Phone didn't answer")
      }
    )
  }

  private func show(notice text: String) {
    DispatchQueue.main.async {
      self.notice = text
      DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
        if self.notice == text { self.notice = nil }
      }
    }
  }

  // MARK: WCSessionDelegate

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    Logger(subsystem: "com.developernick.until", category: "watch").debug("watch activation: state=\(activationState.rawValue) error=\(error?.localizedDescription ?? "none", privacy: .public) hasContext=\(!session.receivedApplicationContext.isEmpty) reachable=\(session.isReachable)")
    if activationState == .activated, !session.receivedApplicationContext.isEmpty {
      apply(session.receivedApplicationContext)
    }
    if activationState == .activated, session.isReachable {
      session.sendMessage(["type": "until.watch.refresh"], replyHandler: { _ in }, errorHandler: { _ in })
    }
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    Logger(subsystem: "com.developernick.until", category: "watch").debug("watch received \(applicationContext.count) fields")
    apply(applicationContext)
  }

  func sessionReachabilityDidChange(_ session: WCSession) {
    if session.isReachable {
      session.sendMessage(["type": "until.watch.refresh"], replyHandler: { _ in }, errorHandler: { _ in })
    }
  }
}

#if DEBUG
/// Sample data for screenshots: launch with `-untilWatchDemo`.
enum WatchDemo {
  static let profile = WatchProfile(birthDate: "1990-05-17", deathAge: 80)
  static let extras = WatchExtras(
    streak: WatchStreak(count: 4, dots: [false, false, false, true, true, true, true]),
    tasks: WatchTasks(
      completed: 3,
      total: 5,
      categories: [
        WatchTaskCategory(key: "health", completed: 1, total: 1),
        WatchTaskCategory(key: "learning", completed: 0, total: 1),
        WatchTaskCategory(key: "work", completed: 2, total: 3),
      ]
    ),
    timer: WatchTimer(title: "Deep work", isRunning: false, startMs: 0, elapsedMs: 1_395_000),
    counter: WatchCounter(id: "demo", title: "Water", count: 5)
  )
}
#endif
