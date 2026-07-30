//
//  WatchConnectivityBridge.swift
//  UNTIL — pushes Day widget data to Apple Watch via WCSession.
//

import Foundation
import WatchConnectivity

/// Keeps Apple Watch Day complication / detail in sync with phone WidgetCache.
@objc(WatchConnectivityBridge)
final class WatchConnectivityBridge: NSObject, WCSessionDelegate {
  @objc static let shared = WatchConnectivityBridge()

  private let widgetCacheKey = "widget.cache"
  private let appGroupID = "group.org.reactjs.native.example.UNTIL"
  private var didActivate = false

  private override init() {
    super.init()
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

  /// Push Day fields extracted from widget.cache JSON.
  @objc func pushDayFromWidgetCacheJSON(_ json: String) {
    activateIfNeeded()
    guard let data = json.data(using: .utf8),
          let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return }

    var context: [String: Any] = [:]

    if let progress = number(from: obj["dayProgress"]) {
      context["dayProgress"] = progress.doubleValue
    }
    if let done = number(from: obj["dayPercentDone"]) {
      context["dayPercentDone"] = done.intValue
    }
    if let left = number(from: obj["dayPercentLeft"]) {
      context["dayPercentLeft"] = left.intValue
    }
    if let start = number(from: obj["startOfDay"]) {
      context["startOfDay"] = start.doubleValue
    }
    if let end = number(from: obj["endOfDay"]) {
      context["endOfDay"] = end.doubleValue
    }
    if let hoursLeft = number(from: obj["dayHoursLeft"]) {
      context["dayHoursLeft"] = hoursLeft.doubleValue
    }
    if let remaining = number(from: obj["dayRemainingMinutes"]) {
      context["dayRemainingMinutes"] = remaining.intValue
    }
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

    guard context["dayProgress"] != nil || context["dayPercentDone"] != nil else { return }
    context["updatedAt"] = Date().timeIntervalSince1970 * 1000

    pushApplicationContext(context)
  }

  /// Re-push from App Group if session becomes reachable / activated.
  func pushCachedIfAvailable() {
    guard let defaults = UserDefaults(suiteName: appGroupID),
          let json = defaults.string(forKey: widgetCacheKey)
    else { return }
    pushDayFromWidgetCacheJSON(json)
  }

  private func number(from value: Any?) -> NSNumber? {
    if let n = value as? NSNumber { return n }
    if let d = value as? Double { return NSNumber(value: d) }
    if let i = value as? Int { return NSNumber(value: i) }
    if let i64 = value as? Int64 { return NSNumber(value: i64) }
    return nil
  }

  private func pushApplicationContext(_ context: [String: Any]) {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    guard session.activationState == .activated else { return }
    guard session.isPaired, session.isWatchAppInstalled else { return }
    do {
      try session.updateApplicationContext(context)
    } catch {
      // Best-effort; next widget sync will retry.
    }
  }

  // MARK: - WCSessionDelegate

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    if activationState == .activated {
      pushCachedIfAvailable()
    }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }

  func sessionWatchStateDidChange(_ session: WCSession) {
    if session.isPaired, session.isWatchAppInstalled {
      pushCachedIfAvailable()
    }
  }

  func session(
    _ session: WCSession,
    didReceiveMessage message: [String: Any],
    replyHandler: @escaping ([String: Any]) -> Void
  ) {
    if (message["type"] as? String) == "until.watch.refresh" {
      pushCachedIfAvailable()
    }
    replyHandler(["ok": true])
  }
}
