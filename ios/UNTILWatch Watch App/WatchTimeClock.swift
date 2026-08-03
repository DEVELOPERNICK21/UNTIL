import Foundation

enum WatchTimeClock {
  static func day(now: Date = Date(), calendar: Calendar = .current) -> PeriodSnapshot {
    let start = calendar.startOfDay(for: now)
    guard let end = calendar.date(byAdding: .day, value: 1, to: start) else {
      return empty(now: now)
    }
    let total = max(1.0, end.timeIntervalSince(start))
    let elapsed = min(max(0, now.timeIntervalSince(start)), total)
    let progress = elapsed / total
    let percentDone = Int((progress * 100).rounded(.towardZero)).clamped(to: 0...100)
    let remainingSec = max(0, Int(end.timeIntervalSince(now)))
    let h = remainingSec / 3600
    let m = (remainingSec % 3600) / 60
    return PeriodSnapshot(
      progress: progress,
      percentDone: percentDone,
      percentLeft: (100 - percentDone).clamped(to: 0...100),
      remainingLabel: "\(h)h \(m)m left",
      passedLabel: "",
      updatedAt: now.timeIntervalSince1970 * 1000
    )
  }

  static func month(now: Date = Date(), calendar: Calendar = .current) -> PeriodSnapshot {
    let dayOfMonth = calendar.component(.day, from: now)
    let daysInMonth = calendar.range(of: .day, in: .month, for: now)?.count ?? 30
    let progress = Double(dayOfMonth - 1) / Double(daysInMonth)
    let percentDone = Int((progress * 100).rounded(.towardZero)).clamped(to: 0...100)
    let remainingDays = max(0, daysInMonth - dayOfMonth)
    return PeriodSnapshot(
      progress: progress,
      percentDone: percentDone,
      percentLeft: (100 - percentDone).clamped(to: 0...100),
      remainingLabel: "\(remainingDays) days left",
      passedLabel: "Day \(dayOfMonth) of \(daysInMonth)",
      updatedAt: now.timeIntervalSince1970 * 1000
    )
  }

  static func year(now: Date = Date(), calendar: Calendar = .current) -> PeriodSnapshot {
    let dayOfYear = calendar.ordinality(of: .day, in: .year, for: now) ?? 1
    let daysInYear = calendar.range(of: .day, in: .year, for: now)?.count ?? 365
    let progress = Double(dayOfYear) / Double(daysInYear)
    let percentDone = Int((progress * 100).rounded(.towardZero)).clamped(to: 0...100)
    let remainingDays = max(0, daysInYear - dayOfYear)
    return PeriodSnapshot(
      progress: progress,
      percentDone: percentDone,
      percentLeft: (100 - percentDone).clamped(to: 0...100),
      remainingLabel: "\(remainingDays) days left",
      passedLabel: "Day \(dayOfYear) of \(daysInYear)",
      updatedAt: now.timeIntervalSince1970 * 1000
    )
  }

  private static func empty(now: Date) -> PeriodSnapshot {
    PeriodSnapshot(
      progress: 0, percentDone: 0, percentLeft: 100,
      remainingLabel: "0h 0m left", passedLabel: "",
      updatedAt: now.timeIntervalSince1970 * 1000
    )
  }
}

private extension Int {
  func clamped(to range: ClosedRange<Int>) -> Int {
    Swift.min(range.upperBound, Swift.max(range.lowerBound, self))
  }
}
