//
//  WatchExtras.swift
//  Streak, tasks and hour timer for the watch, as sent by the phone.
//  Pure Foundation so the WatchMath package can test it.
//

import Foundation

/// Days in a row the user has opened UNTIL.
struct WatchStreak: Equatable {
  var count: Int
  /// Last seven days, oldest first. The last one is today.
  var dots: [Bool]
  /// When the phone worked the dots out (ms since epoch). Lets the watch move them on after midnight.
  var asOfMs: Double? = nil

  /// The same dots moved forward to `now`: each day since the phone last synced pushes them one
  /// place left and adds an empty day on the right.
  func aligned(now: Date = Date(), calendar: Calendar = .current) -> WatchStreak {
    guard let asOfMs, !dots.isEmpty else { return self }
    let asOf = Date(timeIntervalSince1970: asOfMs / 1000)
    let gone = calendar.dateComponents([.day], from: calendar.startOfDay(for: asOf), to: calendar.startOfDay(for: now)).day ?? 0
    guard gone > 0 else { return self }
    let shift = min(gone, dots.count)
    var moved = WatchStreak(count: count, dots: Array(dots.dropFirst(shift)) + Array(repeating: false, count: shift), asOfMs: asOfMs)
    moved.asOfMs = asOfMs
    return moved
  }

  /// One letter per dot, ending with today's weekday.
  func weekdayInitials(now: Date = Date(), calendar: Calendar = .current) -> [String] {
    let symbols = calendar.veryShortStandaloneWeekdaySymbols
    return (0..<dots.count).map { index in
      let daysAgo = dots.count - 1 - index
      let day = calendar.date(byAdding: .day, value: -daysAgo, to: now) ?? now
      let weekday = calendar.component(.weekday, from: day) - 1
      return symbols.indices.contains(weekday) ? symbols[weekday] : ""
    }
  }

  var noticedToday: Bool { dots.last ?? false }
}

struct WatchTaskCategory: Equatable, Identifiable {
  var key: String
  var completed: Int
  var total: Int
  var id: String { key }

  var label: String {
    switch key {
    case "health": return "Health"
    case "work": return "Work"
    case "personal_care": return "Self care"
    case "learning": return "Learning"
    case "other": return "Other"
    default: return key.replacingOccurrences(of: "_", with: " ").capitalized
    }
  }
}

struct WatchTasks: Equatable {
  var completed: Int
  var total: Int
  var categories: [WatchTaskCategory]

  var share: Double {
    total > 0 ? min(1, max(0, Double(completed) / Double(total))) : 0
  }

  var allDone: Bool { total > 0 && completed >= total }
}

/// The hour timer, in the same shape the phone, widget and Dynamic Island share.
struct WatchTimer: Equatable {
  var title: String
  var isRunning: Bool
  /// When the current run began (ms since epoch). Zero when stopped.
  var startMs: Double
  /// Time banked before the current run (ms).
  var elapsedMs: Double

  static let idle = WatchTimer(title: "Hour timer", isRunning: false, startMs: 0, elapsedMs: 0)

  /// Total time on the clock right now, in milliseconds.
  func totalMs(now: Date = Date()) -> Double {
    guard isRunning, startMs > 0 else { return max(0, elapsedMs) }
    return max(0, elapsedMs + now.timeIntervalSince1970 * 1000 - startMs)
  }

  /// A date to hand to `Text(_, style: .timer)`, which then counts up by itself.
  func origin(now: Date = Date()) -> Date {
    Date(timeIntervalSince1970: (now.timeIntervalSince1970 * 1000 - totalMs(now: now)) / 1000)
  }

  /// Share of the current hour, 0...1.
  func hourFraction(now: Date = Date()) -> Double {
    let hour = 3_600_000.0
    return totalMs(now: now).truncatingRemainder(dividingBy: hour) / hour
  }

  /// H:MM:SS, or M:SS under an hour.
  func text(now: Date = Date()) -> String {
    let total = Int(totalMs(now: now) / 1000)
    let h = total / 3600, m = (total % 3600) / 60, s = total % 60
    return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
  }
}

/// The first custom counter, the same one the counter widget shows.
struct WatchCounter: Equatable {
  var id: String
  var title: String
  var count: Int
}

struct WatchExtras: Equatable {
  var streak: WatchStreak?
  var tasks: WatchTasks?
  var timer: WatchTimer?
  var counter: WatchCounter?

  static let empty = WatchExtras(streak: nil, tasks: nil, timer: nil, counter: nil)

  var isEmpty: Bool { streak == nil && tasks == nil && timer == nil && counter == nil }

  // MARK: Context

  static func from(context: [String: Any]) -> WatchExtras {
    var extras = WatchExtras.empty

    if let count = int(context["streakCount"]) {
      var dots = (context["streakDots"] as? [Any])?.map { bool($0) } ?? []
      if dots.count > 7 { dots = Array(dots.suffix(7)) }
      while dots.count < 7 { dots.insert(false, at: 0) }
      extras.streak = WatchStreak(count: max(0, count), dots: dots, asOfMs: double(context["streakAsOfMs"]))
    }

    if let total = int(context["tasksTotal"]) {
      let completed = int(context["tasksCompleted"]) ?? 0
      var categories: [WatchTaskCategory] = []
      if let raw = context["taskCategories"] as? [String: Any] {
        for (key, value) in raw {
          guard let pair = value as? [Any], pair.count == 2,
                let done = int(pair[0]), let all = int(pair[1]), all > 0
          else { continue }
          categories.append(WatchTaskCategory(key: key, completed: done, total: all))
        }
      }
      // Fixed order so the list does not shuffle between updates.
      categories.sort { $0.key < $1.key }
      extras.tasks = WatchTasks(completed: max(0, completed), total: max(0, total), categories: categories)
    }

    if context["timerRunning"] != nil || context["timerElapsedMs"] != nil {
      let title = (context["timerTitle"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? WatchTimer.idle.title
      extras.timer = WatchTimer(
        title: title,
        isRunning: bool(context["timerRunning"]),
        startMs: double(context["timerStartMs"]) ?? 0,
        elapsedMs: double(context["timerElapsedMs"]) ?? 0
      )
    }

    if let id = context["counterId"] as? String, !id.isEmpty {
      extras.counter = WatchCounter(
        id: id,
        title: (context["counterTitle"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "Counter",
        count: max(0, int(context["counterCount"]) ?? 0)
      )
    }

    return extras
  }

  func toDictionary() -> [String: Any] {
    var d: [String: Any] = [:]
    if let streak {
      d["streakCount"] = streak.count
      d["streakDots"] = streak.dots
      if let asOf = streak.asOfMs { d["streakAsOfMs"] = asOf }
    }
    if let tasks {
      d["tasksCompleted"] = tasks.completed
      d["tasksTotal"] = tasks.total
      var categories: [String: [Int]] = [:]
      for c in tasks.categories { categories[c.key] = [c.completed, c.total] }
      d["taskCategories"] = categories
    }
    if let timer {
      d["timerTitle"] = timer.title
      d["timerRunning"] = timer.isRunning
      d["timerStartMs"] = timer.startMs
      d["timerElapsedMs"] = timer.elapsedMs
    }
    if let counter {
      d["counterId"] = counter.id
      d["counterTitle"] = counter.title
      d["counterCount"] = counter.count
    }
    return d
  }

  // MARK: Parsing helpers

  private static func int(_ value: Any?) -> Int? {
    if let n = value as? NSNumber { return n.intValue }
    if let i = value as? Int { return i }
    if let d = value as? Double { return Int(d) }
    return nil
  }

  private static func double(_ value: Any?) -> Double? {
    if let n = value as? NSNumber { return n.doubleValue }
    if let d = value as? Double { return d }
    if let i = value as? Int { return Double(i) }
    return nil
  }

  private static func bool(_ value: Any?) -> Bool {
    if let b = value as? Bool { return b }
    if let n = value as? NSNumber { return n.boolValue }
    return false
  }
}

enum WatchExtrasStore {
  static let key = "until.watch.extras"

  private static var defaults: UserDefaults {
    UserDefaults(suiteName: DayWatchCache.suiteName) ?? .standard
  }

  static func load() -> WatchExtras {
    guard let dict = defaults.dictionary(forKey: key) else { return .empty }
    return WatchExtras.from(context: dict)
  }

  /// Saves what the phone sent. A context without any of these fields (an older phone app)
  /// leaves what is stored alone.
  @discardableResult
  static func save(fromContext context: [String: Any]) -> WatchExtras? {
    let extras = WatchExtras.from(context: context)
    guard !extras.isEmpty else { return nil }
    defaults.set(extras.toDictionary(), forKey: key)
    return extras
  }

  static func save(_ extras: WatchExtras) {
    defaults.set(extras.toDictionary(), forKey: key)
  }
}
