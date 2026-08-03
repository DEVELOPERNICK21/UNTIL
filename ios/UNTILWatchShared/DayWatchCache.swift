//
//  DayWatchCache.swift
//  Shared Day model for watchOS app + complication.
//

import Foundation

enum DayWatchDesign {
  static let background = "#0E0E10"
  static let passed = "#AA2222"
  static let left = "#22AA22"
  static let percent = "#E9A23A"
  static let label = "#9A9A9A"
  static let text = "#EDEDED"
}

struct DayWatchCache: Equatable {
  var dayProgress: Double
  var dayPercentDone: Int
  var dayPercentLeft: Int
  var startOfDay: Double?
  var endOfDay: Double?
  var dayHoursLeft: Double?
  var dayRemainingMinutes: Int?
  var updatedAt: Double

  static let userDefaultsKey = "until.watch.day.cache"
  static let suiteName = "group.com.develoeprnick.UNTIL.watch"

  var progressClamped: Double {
    min(1, max(0, dayProgress))
  }

  func timeLeftText(now: Date = Date()) -> String {
    if let end = endOfDay {
      let endSec = end / 1000.0
      let remainingSec = max(0, Int(endSec - now.timeIntervalSince1970))
      let h = remainingSec / 3600
      let m = (remainingSec % 3600) / 60
      return "\(h)h \(m)m left"
    }
    if let rm = dayRemainingMinutes {
      let h = rm / 60
      let m = rm % 60
      return "\(h)h \(m)m left"
    }
    if let hours = dayHoursLeft {
      return "\(Int(hours.rounded()))h left"
    }
    let leftPct = dayPercentLeft > 0 ? dayPercentLeft : max(0, 100 - dayPercentDone)
    return "\(leftPct)% left"
  }

  static func fromLocalDay(_ snap: PeriodSnapshot, now: Date = Date()) -> DayWatchCache {
    DayWatchCache(
      dayProgress: snap.progress,
      dayPercentDone: snap.percentDone,
      dayPercentLeft: snap.percentLeft,
      startOfDay: nil,
      endOfDay: nil,
      dayHoursLeft: nil,
      dayRemainingMinutes: nil,
      updatedAt: snap.updatedAt
    )
  }

  static func from(context: [String: Any]) -> DayWatchCache? {
    let progress = (context["dayProgress"] as? NSNumber)?.doubleValue
      ?? (context["dayProgress"] as? Double)
    let done = (context["dayPercentDone"] as? NSNumber)?.intValue
      ?? (context["dayPercentDone"] as? Int)
    guard progress != nil || done != nil else { return nil }

    let p = progress ?? Double(done ?? 0) / 100.0
    let d = done ?? Int((p * 100).rounded())
    let left = (context["dayPercentLeft"] as? NSNumber)?.intValue
      ?? (context["dayPercentLeft"] as? Int)
      ?? max(0, 100 - d)

    return DayWatchCache(
      dayProgress: p,
      dayPercentDone: d,
      dayPercentLeft: left,
      startOfDay: (context["startOfDay"] as? NSNumber)?.doubleValue
        ?? (context["startOfDay"] as? Double),
      endOfDay: (context["endOfDay"] as? NSNumber)?.doubleValue
        ?? (context["endOfDay"] as? Double),
      dayHoursLeft: (context["dayHoursLeft"] as? NSNumber)?.doubleValue
        ?? (context["dayHoursLeft"] as? Double),
      dayRemainingMinutes: (context["dayRemainingMinutes"] as? NSNumber)?.intValue
        ?? (context["dayRemainingMinutes"] as? Int),
      updatedAt: (context["updatedAt"] as? NSNumber)?.doubleValue
        ?? (context["updatedAt"] as? Double)
        ?? Date().timeIntervalSince1970 * 1000
    )
  }

  func toDictionary() -> [String: Any] {
    var d: [String: Any] = [
      "dayProgress": dayProgress,
      "dayPercentDone": dayPercentDone,
      "dayPercentLeft": dayPercentLeft,
      "updatedAt": updatedAt,
    ]
    if let startOfDay { d["startOfDay"] = startOfDay }
    if let endOfDay { d["endOfDay"] = endOfDay }
    if let dayHoursLeft { d["dayHoursLeft"] = dayHoursLeft }
    if let dayRemainingMinutes { d["dayRemainingMinutes"] = dayRemainingMinutes }
    return d
  }
}

enum WatchDayStore {
  private static var defaults: UserDefaults {
    UserDefaults(suiteName: DayWatchCache.suiteName) ?? .standard
  }

  static func load() -> DayWatchCache? {
    guard let dict = defaults.dictionary(forKey: DayWatchCache.userDefaultsKey) else {
      return nil
    }
    return DayWatchCache.from(context: dict)
  }

  static func save(_ cache: DayWatchCache) {
    defaults.set(cache.toDictionary(), forKey: DayWatchCache.userDefaultsKey)
  }

  static func save(fromContext context: [String: Any]) -> DayWatchCache? {
    guard let cache = DayWatchCache.from(context: context) else { return nil }
    save(cache)
    return cache
  }
}
