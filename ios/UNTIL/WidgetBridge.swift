//
//  WidgetBridge.swift
//  UNTIL
//

import Foundation
import React
import WidgetKit

private let appGroupID = "group.org.reactjs.native.example.UNTIL"
private let widgetCacheKey = "widget.cache"
private let customCountersKey = "custom.counters"
private let countdownsKey = "countdowns"

private let kindDay = "UNTILDayWidget"
private let kindMonth = "UNTILMonthWidget"
private let kindYear = "UNTILYearWidget"
private let kindCounter = "UNTILCounterWidget"
private let kindCountdown = "UNTILCountdownWidget"

@objc(WidgetBridge)
class WidgetBridge: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func setWidgetCache(_ json: String) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
    defaults.set(json, forKey: widgetCacheKey)
    defaults.synchronize()
    WidgetCenter.shared.reloadTimelines(ofKind: kindDay)
    WidgetCenter.shared.reloadTimelines(ofKind: kindMonth)
    WidgetCenter.shared.reloadTimelines(ofKind: kindYear)
  }

  @objc func setCustomCounters(_ json: String) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
    defaults.set(json, forKey: customCountersKey)
    defaults.synchronize()
    WidgetCenter.shared.reloadTimelines(ofKind: kindCounter)
  }

  @objc func setCountdowns(_ json: String) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
    defaults.set(json, forKey: countdownsKey)
    defaults.synchronize()
    WidgetCenter.shared.reloadTimelines(ofKind: kindCountdown)
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
        ]
        resolve(payload)
      case .failure(let error):
        reject("WIDGET_STATUS_ERROR", error.localizedDescription, error)
      }
    }
  }
}
