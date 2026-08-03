import XCTest
@testable import WatchMath

final class WatchTimeClockTests: XCTestCase {
  private func date(_ y: Int, _ m: Int, _ d: Int, _ h: Int, _ min: Int) -> Date {
    var c = Calendar(identifier: .gregorian)
    c.timeZone = .current
    return c.date(from: DateComponents(year: y, month: m, day: d, hour: h, minute: min))!
  }

  func testDayAtNoonNearFiftyPercent() {
    let snap = WatchTimeClock.day(now: date(2026, 7, 20, 12, 0))
    XCTAssertTrue((49...51).contains(snap.percentDone))
  }

  func testMonthOnFirstIsZero() {
    let snap = WatchTimeClock.month(now: date(2026, 7, 1, 8, 0))
    XCTAssertEqual(snap.percentDone, 0)
    XCTAssertTrue(snap.remainingLabel.contains("days left"))
  }

  func testYearOnJan1NearZero() {
    let snap = WatchTimeClock.year(now: date(2026, 1, 1, 1, 0))
    XCTAssertLessThanOrEqual(snap.percentDone, 1)
  }
}
