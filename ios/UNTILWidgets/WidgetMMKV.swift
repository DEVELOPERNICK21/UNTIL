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
    static let dailyTasksWidgetKey = "daily.tasks.widget"
    static let hourCalculationWidgetKey = "hour.calculation.widget"
    static let premiumKey = "premium.isActive"

    static var isPremium: Bool {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return false }
        return defaults.bool(forKey: premiumKey)
    }

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

    static func loadDailyTasksStatsJSON() -> String? {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return nil }
        return defaults.string(forKey: dailyTasksWidgetKey)
    }

    static func loadHourCalculationJSON() -> String? {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return nil }
        return defaults.string(forKey: hourCalculationWidgetKey)
    }

    /// Write hour calculation state (used by widget App Intent to toggle start/stop without opening app).
    static func writeHourCalculationJSON(_ json: String) {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
        defaults.set(json, forKey: hourCalculationWidgetKey)
        defaults.synchronize()
    }

    /// Write custom counters JSON (used by widget extension App Intent to persist increment without opening app).
    static func writeCustomCountersJSON(_ json: String) {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
        defaults.set(json, forKey: customCountersKey)
        defaults.synchronize()
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

/// Hour calculation (stopwatch) widget state — same key/format as Android
struct HourCalculationState: Codable {
    let title: String
    let isRunning: Bool
    let startTimeMs: Int64
    let totalElapsedMs: Int64
}
