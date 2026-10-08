//
//  WatchPeriodMath.swift
//  The numbers each watch page shows, worked out from the clock. Pure Foundation.
//

import Foundation

struct WatchDayParts: Equatable {
  var progress: Double
  var hoursLeft: Int
  var minutesLeft: Int
  var end: Date

  /// "11h 7m"
  var leftText: String { "\(hoursLeft)h \(minutesLeft)m" }
}

struct WatchMonthParts: Equatable {
  var name: String
  var day: Int
  var daysInMonth: Int
  var daysLeft: Int
  /// Empty cells before the 1st so the grid lines up with the locale's first weekday.
  var leadingBlanks: Int
  var progress: Double
}

struct WatchYearParts: Equatable {
  var year: Int
  var day: Int
  var daysInYear: Int
  var daysLeft: Int
  var progress: Double
}

struct WatchLifeParts: Equatable {
  var yearsLived: Double
  var yearsLeft: Double
  var deathAge: Int
  var progress: Double
}

enum WatchPeriodMath {
  /// Time left today. The count includes today, like the widgets.
  static func day(now: Date = Date(), calendar: Calendar = .current) -> WatchDayParts {
    let start = calendar.startOfDay(for: now)
    let end = calendar.date(byAdding: .day, value: 1, to: start) ?? now.addingTimeInterval(86_400)
    let span = max(1, end.timeIntervalSince(start))
    let progress = min(1, max(0, now.timeIntervalSince(start) / span))
    let left = max(0, Int(end.timeIntervalSince(now)))
    return WatchDayParts(progress: progress, hoursLeft: left / 3600, minutesLeft: (left % 3600) / 60, end: end)
  }

  static func month(now: Date = Date(), calendar: Calendar = .current) -> WatchMonthParts {
    let day = calendar.component(.day, from: now)
    let days = calendar.range(of: .day, in: .month, for: now)?.count ?? 30
    let symbols = calendar.monthSymbols
    let index = max(0, min(symbols.count - 1, calendar.component(.month, from: now) - 1))
    var blanks = 0
    if let first = calendar.date(from: calendar.dateComponents([.year, .month], from: now)) {
      let weekday = calendar.component(.weekday, from: first)
      blanks = (weekday - calendar.firstWeekday + 7) % 7
    }
    return WatchMonthParts(
      name: symbols.isEmpty ? "" : symbols[index],
      day: day,
      daysInMonth: days,
      daysLeft: max(0, days - day),
      leadingBlanks: blanks,
      progress: Double(day) / Double(max(1, days))
    )
  }

  static func year(now: Date = Date(), calendar: Calendar = .current) -> WatchYearParts {
    let day = calendar.ordinality(of: .day, in: .year, for: now) ?? 1
    let days = calendar.range(of: .day, in: .year, for: now)?.count ?? 365
    return WatchYearParts(
      year: calendar.component(.year, from: now),
      day: day,
      daysInYear: days,
      daysLeft: max(0, days - day),
      progress: Double(day) / Double(max(1, days))
    )
  }

  /// Nil until the phone has sent a birth date.
  static func life(profile: WatchProfile?, now: Date = Date()) -> WatchLifeParts? {
    guard let profile, let snap = WatchLifeClock.snapshot(profile: profile, now: now) else { return nil }
    let age = profile.deathAge <= 0 ? 80 : profile.deathAge
    let progress = snap.progressClamped
    return WatchLifeParts(
      yearsLived: progress * Double(age),
      yearsLeft: (1 - progress) * Double(age),
      deathAge: age,
      progress: progress
    )
  }
}

/// One decimal, rounded half up, so 48.25 reads 48.3 on every surface.
func watchOneDecimal(_ value: Double) -> String {
  String(format: "%.1f", (value * 10).rounded() / 10)
}
