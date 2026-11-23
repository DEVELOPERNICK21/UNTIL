//
//  WidgetBridge.swift
//  UNTIL
//

import Foundation
import React
import UIKit
import WidgetKit

private let appGroupID = "group.com.developernick.until"
private let widgetCacheKey = "widget.cache"
private let customCountersKey = "custom.counters"
private let countdownsKey = "countdowns"
private let dailyTasksWidgetKey = "daily.tasks.widget"
private let hourCalculationWidgetKey = "hour.calculation.widget"
private let pauseGlanceKey = "pause.glance"

private let premiumKey = "premium.isActive"
private let kindDay = "UNTILDayWidget"
private let kindMonth = "UNTILMonthWidget"
private let kindYear = "UNTILYearWidget"
private let kindCounter = "UNTILCounterWidget"
private let kindCountdown = "UNTILCountdownWidget"
private let kindDeadlines = "UNTILDeadlinesWidget"
private let kindDailyTasks = "UNTILDailyTasksWidget"
private let kindHourCalculation = "UNTILHourCalculationWidget"
private let kindPause = "UNTILPauseWidget"

@objc(WidgetBridge)
class WidgetBridge: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  /// Keeps the screen from locking while Pause is showing, and lets go again when it closes.
  @objc func setKeepScreenAwake(_ enabled: Bool) {
    DispatchQueue.main.async {
      UIApplication.shared.isIdleTimerDisabled = enabled
    }
  }

  @objc func setPremiumStatus(_ isPremium: Bool) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
    defaults.set(isPremium, forKey: premiumKey)
    defaults.synchronize()
    WidgetCenter.shared.reloadAllTimelines()
  }

  @objc func setWidgetCache(_ json: String) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
    defaults.set(json, forKey: widgetCacheKey)
    defaults.synchronize()
    WidgetCenter.shared.reloadAllTimelines()
    WatchConnectivityBridge.shared.pushDayFromWidgetCacheJSON(json)
  }

  @objc func setCustomCounters(_ json: String) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
    defaults.set(json, forKey: customCountersKey)
    defaults.synchronize()
    WidgetCenter.shared.reloadTimelines(ofKind: kindCounter)
    WatchConnectivityBridge.shared.pushCachedIfAvailable()
  }

  @objc func setCountdowns(_ json: String) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
    defaults.set(json, forKey: countdownsKey)
    defaults.synchronize()
    WidgetCenter.shared.reloadTimelines(ofKind: kindCountdown)
    WidgetCenter.shared.reloadTimelines(ofKind: kindDeadlines)
  }

  @objc func setDailyTasksStats(_ json: String) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
    defaults.set(json, forKey: dailyTasksWidgetKey)
    defaults.synchronize()
    WidgetCenter.shared.reloadTimelines(ofKind: kindDailyTasks)
    WatchConnectivityBridge.shared.pushCachedIfAvailable()
  }

  /// Pause at a glance (counts only) for the Breathe widget. The island gets the same numbers in its own state.
  @objc func setPauseGlance(_ json: String) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
    defaults.set(json, forKey: pauseGlanceKey)
    defaults.synchronize()
    WidgetCenter.shared.reloadTimelines(ofKind: kindPause)
  }

  @objc func setHourCalculationState(_ json: String) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
    defaults.set(json, forKey: hourCalculationWidgetKey)
    defaults.synchronize()
    WidgetCenter.shared.reloadTimelines(ofKind: kindHourCalculation)
    WatchConnectivityBridge.shared.pushCachedIfAvailable()
  }

  /// Hour timer as last written by the widget or the Dynamic Island (they work with the app closed).
  @objc func getHourCalculationFromAppGroup(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else {
      resolve(nil)
      return
    }
    resolve(defaults.string(forKey: hourCalculationWidgetKey))
  }

  @objc func getCustomCountersFromAppGroup(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else {
      resolve(nil)
      return
    }
    resolve(defaults.string(forKey: customCountersKey))
  }

  @objc func getWidgetStatus(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    WidgetCenter.shared.getCurrentConfigurations { result in
      switch result {
      case .success(let configs):
        let kinds = configs.map { $0.kind }
        let payload: [String: Bool] = [
          "dayWidgetAdded": kinds.contains(kindDay),
          "monthWidgetAdded": kinds.contains(kindMonth),
          "yearWidgetAdded": kinds.contains(kindYear),
          "counterWidgetAdded": kinds.contains(kindCounter),
          "countdownWidgetAdded": kinds.contains(kindCountdown),
          "deadlinesWidgetAdded": kinds.contains(kindDeadlines),
          "dailyTasksWidgetAdded": kinds.contains(kindDailyTasks),
          "hourCalculationWidgetAdded": kinds.contains(kindHourCalculation),
        ]
        resolve(payload)
      case .failure(let error):
        reject("WIDGET_STATUS_ERROR", error.localizedDescription, error)
      }
    }
  }
}
