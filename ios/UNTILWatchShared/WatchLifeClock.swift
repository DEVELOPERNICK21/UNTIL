import Foundation

enum WatchLifeClock {
  private static let msPerYear = 365.25 * 24 * 60 * 60 * 1000
  private static let defaultDeathAge = 80

  static func snapshot(profile: WatchProfile?, now: Date = Date()) -> PeriodSnapshot? {
    guard let profile else { return nil }
    guard let birth = parseBirthDate(profile.birthDate) else { return nil }
    let deathAge = profile.deathAge <= 0 ? defaultDeathAge : profile.deathAge
    var death = Calendar.current.dateComponents([.year, .month, .day], from: birth)
    death.year = (death.year ?? 0) + deathAge
    guard let deathDate = Calendar.current.date(from: death) else { return nil }

    let startMs = birth.timeIntervalSince1970 * 1000
    let endMs = deathDate.timeIntervalSince1970 * 1000
    let nowMs = now.timeIntervalSince1970 * 1000
    let totalMs = max(1.0, endMs - startMs)
    let elapsedMs = nowMs - startMs
    let progress: Double
    if elapsedMs <= 0 { progress = 0 }
    else if elapsedMs >= totalMs { progress = 1 }
    else { progress = min(1, max(0, elapsedMs / totalMs)) }

    let percentDone = Int((progress * 100).rounded(.towardZero)).clamped(to: 0...100)
    let yearsLived = max(0, elapsedMs / msPerYear)
    let yearsLeft = max(0, (endMs - nowMs) / msPerYear)

    return PeriodSnapshot(
      progress: progress,
      percentDone: percentDone,
      percentLeft: (100 - percentDone).clamped(to: 0...100),
      remainingLabel: "\(Int(yearsLeft))y left",
      passedLabel: "\(Int(yearsLived))y lived",
      updatedAt: nowMs
    )
  }

  private static func parseBirthDate(_ iso: String) -> Date? {
    let trimmed = iso.trimmingCharacters(in: .whitespacesAndNewlines)
    guard trimmed.count >= 10 else { return nil }
    let parts = trimmed.split(separator: "-")
    guard parts.count == 3,
          let y = Int(parts[0]), let m = Int(parts[1]), let d = Int(parts[2]),
          m >= 1, m <= 12, d >= 1, d <= 31
    else { return nil }
    return Calendar.current.date(from: DateComponents(year: y, month: m, day: d))
  }
}

private extension Int {
  func clamped(to range: ClosedRange<Int>) -> Int {
    Swift.min(range.upperBound, Swift.max(range.lowerBound, self))
  }
}
