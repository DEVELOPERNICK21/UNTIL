//
//  WidgetMMKV.swift
//  UNTILWidgets
//

import Foundation

/// Reads widget cache from UserDefaults App Group (written by main app via WidgetBridge)
enum WidgetCacheReader {
    static let appGroupID = "group.org.reactjs.native.example.UNTIL"
    static let widgetCacheKey = "widget.cache"
    static let customCountersKey = "custom.counters"
    static let countdownsKey = "countdowns"

    static func loadJSON() -> String? {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return nil }
        return defaults.string(forKey: widgetCacheKey)
    }

    static func loadCustomCountersJSON() -> String? {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return nil }
        return defaults.string(forKey: customCountersKey)
    }

    static func loadCountdownsJSON() -> String? {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return nil }
        return defaults.string(forKey: countdownsKey)
    }
}

/// Custom counter model for widget (id, title, count)
struct CustomCounterItem: Codable {
    let id: String
    let title: String
    let count: Int
}

/// Countdown model for widget (id, title, date YYYY-MM-DD)
struct CountdownItem: Codable {
    let id: String
    let title: String
    let date: String
}
