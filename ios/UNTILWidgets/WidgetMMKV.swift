//
//  WidgetMMKV.swift
//  UNTILWidgets
//

import Foundation

/// Reads widget cache from UserDefaults App Group (written by main app via WidgetBridge)
enum WidgetCacheReader {
    static let appGroupID = "group.org.reactjs.native.example.UNTIL"
    static let widgetCacheKey = "widget.cache"

    static func loadJSON() -> String? {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return nil }
        return defaults.string(forKey: widgetCacheKey)
    }
}
