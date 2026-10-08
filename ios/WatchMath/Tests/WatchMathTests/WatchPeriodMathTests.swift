import XCTest
@testable import WatchMath

final class WatchPeriodMathTests: XCTestCase {
  private var cal: Calendar {
    var c = Calendar(identifier: .gregorian)
    c.timeZone = TimeZone(identifier: "UTC")!
    c.locale = Locale(identifier: "en_US_POSIX")
    c.firstWeekday = 1 // Sunday
    return c
  }

  private func date(_ y: Int, _ m: Int, _ d: Int, _ h: Int = 0, _ min: Int = 0) -> Date {
    cal.date(from: DateComponents(year: y, month: m, day: d, hour: h, minute: min))!
  }

  func testDayLeftAtNoonIsTwelveHours() {
    let parts = WatchPeriodMath.day(now: date(2026, 10, 1, 12, 0), calendar: cal)
    XCTAssertEqual(parts.hoursLeft, 12)
    XCTAssertEqual(parts.minutesLeft, 0)
    XCTAssertEqual(parts.progress, 0.5, accuracy: 0.001)
    XCTAssertEqual(parts.leftText, "12h 0m")
  }

  func testMonthCountsTodayAsPassed() {
    let parts = WatchPeriodMath.month(now: date(2026, 10, 1), calendar: cal)
    XCTAssertEqual(parts.name, "October")
    XCTAssertEqual(parts.day, 1)
    XCTAssertEqual(parts.daysInMonth, 31)
    XCTAssertEqual(parts.daysLeft, 30)
    XCTAssertEqual(parts.leadingBlanks, 4) // 1 Oct 2026 is a Thursday, the week starts on Sunday
  }

  func testYearMatchesWidgets() {
    let parts = WatchPeriodMath.year(now: date(2026, 10, 1), calendar: cal)
    XCTAssertEqual(parts.day, 274)
    XCTAssertEqual(parts.daysInYear, 365)
    XCTAssertEqual(parts.daysLeft, 91)
  }

  func testLifeIsNilWithoutABirthDate() {
    XCTAssertNil(WatchPeriodMath.life(profile: nil))
  }

  func testLifeYearsAddUpToThePlan() {
    let profile = WatchProfile(birthDate: "1990-01-01", deathAge: 80)
    let parts = WatchPeriodMath.life(profile: profile, now: date(2026, 10, 1))
    XCTAssertNotNil(parts)
    XCTAssertEqual((parts!.yearsLived + parts!.yearsLeft), 80, accuracy: 0.001)
    XCTAssertEqual(parts!.deathAge, 80)
  }

  func testOneDecimalRoundsHalfUp() {
    XCTAssertEqual(watchOneDecimal(48.25), "48.3")
    XCTAssertEqual(watchOneDecimal(0), "0.0")
  }
}

final class WatchStickersTests: XCTestCase {
  func testStagesFollowTheState() {
    XCTAssertEqual(WatchStickers.todayStage(progress: 0.0), 0)
    XCTAssertEqual(WatchStickers.todayStage(progress: 0.5), 2)
    XCTAssertEqual(WatchStickers.todayStage(progress: 0.99), 5)
    XCTAssertEqual(WatchStickers.yearStage(month: 1), 0)
    XCTAssertEqual(WatchStickers.yearStage(month: 10), 4)
    XCTAssertEqual(WatchStickers.tasksStage(completed: 0, total: 0), 0)
    XCTAssertEqual(WatchStickers.tasksStage(completed: 3, total: 3), 4)
    XCTAssertEqual(WatchStickers.streakStage(count: 32), 4)
  }

  func testEveryPageHasThreePacksAndTheirStagesAreInRange() {
    for kind in WatchPageKind.allCases {
      for pack in 0..<WatchStickers.packCount {
        for stage in 0...5 {
          XCTAssertFalse(WatchStickers.emoji(kind, pack: pack, stage: stage).isEmpty)
        }
      }
    }
  }

  func testPacksCycleAndWrap() {
    XCTAssertEqual(WatchStickers.nextPack(0), 1)
    XCTAssertEqual(WatchStickers.nextPack(2), 0)
  }
}
