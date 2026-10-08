//
//  WatchConnectivityBridge.swift
//  UNTIL — pushes widget, streak, task and timer data to Apple Watch via WCSession.
//

import Foundation
import WatchConnectivity
import WidgetKit
import os

/// Keeps Apple Watch Day complication / detail in sync with phone WidgetCache.
@objc(WatchConnectivityBridge)
final class WatchConnectivityBridge: NSObject, WCSessionDelegate {
  @objc static let shared = WatchConnectivityBridge()

  private let log = Logger(subsystem: "com.developernick.until", category: "watch")
  private let widgetCacheKey = "widget.cache"
  private let dailyTasksKey = "daily.tasks.widget"
  private let customCountersKey = "custom.counters"
  private let appGroupID = "group.com.developernick.until"
  private var didActivate = false

  private override init() {
    super.init()
    // A button on the Dynamic Island or the widget changed the timer: tell the watch.
    NotificationCenter.default.addObserver(
      forName: HourTimerStore.changedNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.pushCachedIfAvailable()
    }
  }

  /// Call once from AppDelegate after launch.
  @objc static func start() {
    shared.activateIfNeeded()
  }

  private func activateIfNeeded() {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    session.delegate = self
    if !didActivate {
      didActivate = true
      session.activate()
    }
  }

  /// Push everything the watch shows. `json` is the widget cache the app just saved.
  @objc func pushDayFromWidgetCacheJSON(_ json: String) {
    activateIfNeeded()
    pushApplicationContext(buildContext(cacheJSON: json))
  }

  /// Re-push from the App Group, for example when the session becomes reachable.
  func pushCachedIfAvailable() {
    let defaults = UserDefaults(suiteName: appGroupID)
    pushApplicationContext(buildContext(cacheJSON: defaults?.string(forKey: widgetCacheKey)))
  }

  /// One context with every field. `updateApplicationContext` replaces the previous one, so
  /// each push has to carry it all.
  private func buildContext(cacheJSON: String?) -> [String: Any] {
    var context: [String: Any] = [:]
    let defaults = UserDefaults(suiteName: appGroupID)

    if let cacheJSON,
       let data = cacheJSON.data(using: .utf8),
       let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
      addDay(from: obj, to: &context)
      addStreak(from: obj, to: &context)
    }
    addTasks(from: defaults?.string(forKey: dailyTasksKey), to: &context)
    addTimer(from: defaults?.string(forKey: HourTimerStore.key), to: &context)
    addCounter(from: defaults?.string(forKey: customCountersKey), to: &context)
    return context
  }

  private struct CounterItem: Codable {
    var id: String
    var title: String
    var count: Int
  }

  private func loadCounters() -> [CounterItem] {
    guard let json = UserDefaults(suiteName: appGroupID)?.string(forKey: customCountersKey),
          let data = json.data(using: .utf8),
          let list = try? JSONDecoder().decode([CounterItem].self, from: data)
    else { return [] }
    return list
  }

  /// The first counter, like the counter widget.
  private func addCounter(from json: String?, to context: inout [String: Any]) {
    guard let first = loadCounters().first else { return }
    context.merge(counterFields(first)) { _, new in new }
  }

  private func counterFields(_ counter: CounterItem) -> [String: Any] {
    ["counterId": counter.id, "counterTitle": counter.title, "counterCount": counter.count]
  }

  /// Add or take off one, the same way the counter widget does. The app picks the new count up
  /// the next time it opens.
  private func changeCounter(id: String, by change: Int) -> CounterItem? {
    var list = loadCounters()
    guard let index = list.firstIndex(where: { $0.id == id }) else { return nil }
    list[index].count = max(0, list[index].count + change)
    if let data = try? JSONEncoder().encode(list), let json = String(data: data, encoding: .utf8) {
      UserDefaults(suiteName: appGroupID)?.set(json, forKey: customCountersKey)
    }
    WidgetCenter.shared.reloadTimelines(ofKind: "UNTILCounterWidget")
    return list[index]
  }

  private func addDay(from obj: [String: Any], to context: inout [String: Any]) {
    if let progress = number(from: obj["dayProgress"]) { context["dayProgress"] = progress.doubleValue }
    if let done = number(from: obj["dayPercentDone"]) { context["dayPercentDone"] = done.intValue }
    if let left = number(from: obj["dayPercentLeft"]) { context["dayPercentLeft"] = left.intValue }
    if let start = number(from: obj["startOfDay"]) { context["startOfDay"] = start.doubleValue }
    if let end = number(from: obj["endOfDay"]) { context["endOfDay"] = end.doubleValue }
    if let hoursLeft = number(from: obj["dayHoursLeft"]) { context["dayHoursLeft"] = hoursLeft.doubleValue }
    if let remaining = number(from: obj["dayRemainingMinutes"]) { context["dayRemainingMinutes"] = remaining.intValue }
    if let birth = obj["birthDate"] as? String {
      let trimmed = birth.trimmingCharacters(in: .whitespacesAndNewlines)
      if !trimmed.isEmpty {
        context["birthDate"] = trimmed
        if let death = number(from: obj["deathAge"]) {
          context["deathAge"] = death.intValue > 0 ? death.intValue : 80
        } else {
          context["deathAge"] = 80
        }
      }
    }
    if let updated = number(from: obj["updatedAt"]) { context["updatedAt"] = updated.doubleValue }
  }

  private func addStreak(from obj: [String: Any], to context: inout [String: Any]) {
    guard let count = number(from: obj["presenceStreakCount"]) else { return }
    context["streakCount"] = count.intValue
    if let asOf = number(from: obj["updatedAt"]) { context["streakAsOfMs"] = asOf.doubleValue }
    if let dots = obj["presenceStreakDots"] as? [Any] {
      context["streakDots"] = dots.map { ($0 as? Bool) ?? (($0 as? NSNumber)?.boolValue ?? false) }
    }
  }

  /// Today's tasks. A payload from an earlier day counts as no tasks yet.
  private func addTasks(from json: String?, to context: inout [String: Any]) {
    guard let json,
          let data = json.data(using: .utf8),
          let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return }
    let isToday = (obj["date"] as? String) == Self.todayKey()
    let total = isToday ? (number(from: obj["total"])?.intValue ?? 0) : 0
    let completed = isToday ? (number(from: obj["completed"])?.intValue ?? 0) : 0
    context["tasksTotal"] = total
    context["tasksCompleted"] = completed
    var categories: [String: [Int]] = [:]
    if isToday, let byCategory = obj["byCategory"] as? [String: Any] {
      for (key, value) in byCategory {
        guard let stats = value as? [String: Any],
              let all = number(from: stats["total"])?.intValue, all > 0
        else { continue }
        categories[key] = [number(from: stats["completed"])?.intValue ?? 0, all]
      }
    }
    context["taskCategories"] = categories
  }

  private func addTimer(from json: String?, to context: inout [String: Any]) {
    var state = HourTimerStore.State.idle
    if let json, let data = json.data(using: .utf8),
       let decoded = try? JSONDecoder().decode(HourTimerStore.State.self, from: data) {
      state = decoded
    }
    context.merge(timerFields(state)) { _, new in new }
  }

  private func timerFields(_ state: HourTimerStore.State) -> [String: Any] {
    [
      "timerTitle": state.title,
      "timerRunning": state.isRunning,
      "timerStartMs": Double(state.startTimeMs),
      "timerElapsedMs": Double(state.totalElapsedMs),
    ]
  }

  private static func todayKey() -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: Date())
  }

  private func number(from value: Any?) -> NSNumber? {
    if let n = value as? NSNumber { return n }
    if let d = value as? Double { return NSNumber(value: d) }
    if let i = value as? Int { return NSNumber(value: i) }
    if let i64 = value as? Int64 { return NSNumber(value: i64) }
    return nil
  }

  private func pushApplicationContext(_ input: [String: Any]) {
    guard !input.isEmpty else { return }
    var context = input
    context["updatedAt"] = Date().timeIntervalSince1970 * 1000
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    guard session.activationState == .activated else {
      log.debug("skip push: session not activated (\(session.activationState.rawValue))")
      return
    }
    guard session.isPaired, session.isWatchAppInstalled else {
      log.debug("skip push: paired=\(session.isPaired) watchAppInstalled=\(session.isWatchAppInstalled)")
      return
    }
    do {
      try session.updateApplicationContext(context)
      log.debug("pushed \(context.count) fields")
    } catch {
      // Best-effort; next widget sync will retry.
      log.error("push failed: \(error.localizedDescription, privacy: .public)")
    }
  }

  // MARK: - WCSessionDelegate

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    log.debug("activation finished: state=\(activationState.rawValue) error=\(error?.localizedDescription ?? "none", privacy: .public) paired=\(session.isPaired) installed=\(session.isWatchAppInstalled)")
    if activationState == .activated {
      pushCachedIfAvailable()
    }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }

  func sessionWatchStateDidChange(_ session: WCSession) {
    log.debug("watch state changed: paired=\(session.isPaired) installed=\(session.isWatchAppInstalled) reachable=\(session.isReachable)")
    if session.isPaired, session.isWatchAppInstalled {
      pushCachedIfAvailable()
    }
  }

  func session(
    _ session: WCSession,
    didReceiveMessage message: [String: Any],
    replyHandler: @escaping ([String: Any]) -> Void
  ) {
    switch message["type"] as? String {
    case "until.watch.refresh":
      pushCachedIfAvailable()
      replyHandler(["ok": true])
    case "until.watch.timer":
      let action = (message["action"] as? String) ?? "toggle"
      Task {
        let state = await self.runTimer(action: action)
        self.pushCachedIfAvailable()
        replyHandler(self.timerFields(state))
      }
    case "until.watch.counter":
      let id = (message["id"] as? String) ?? ""
      let change = (message["change"] as? NSNumber)?.intValue ?? 0
      if let counter = changeCounter(id: id, by: max(-1, min(1, change))) {
        pushCachedIfAvailable()
        replyHandler(counterFields(counter))
      } else {
        replyHandler(["ok": false])
      }
    default:
      replyHandler(["ok": true])
    }
  }

  /// Start, pause or reset the hour timer for the watch, the same way the Dynamic Island does,
  /// so the island, the widget and the watch cannot disagree.
  private func runTimer(action: String) async -> HourTimerStore.State {
    if #available(iOS 16.2, *) {
      if action == "reset" {
        await IslandActions.resetHourTimer()
      } else {
        await IslandActions.toggleHourTimer()
      }
    } else {
      let current = HourTimerStore.load()
      let next = action == "reset"
        ? HourTimerStore.reset(current)
        : HourTimerStore.toggled(current, nowMs: Int64(Date().timeIntervalSince1970 * 1000))
      HourTimerStore.save(next)
      WidgetCenter.shared.reloadTimelines(ofKind: "UNTILHourCalculationWidget")
    }
    return HourTimerStore.load()
  }
}
