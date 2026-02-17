//
//  WidgetBridge.swift
//  UNTIL
//

import Foundation
import React

private let appGroupID = "group.com.until.app"
private let widgetCacheKey = "widget.cache"

@objc(WidgetBridge)
class WidgetBridge: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func setWidgetCache(_ json: String) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
    defaults.set(json, forKey: widgetCacheKey)
    defaults.synchronize()
  }
}
