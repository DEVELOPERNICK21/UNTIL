import XCTest
@testable import WatchMath

final class WatchExtrasTests: XCTestCase {
  func testEmptyContextHasNoExtras() {
    XCTAssertTrue(WatchExtras.from(context: ["dayProgress": 0.5]).isEmpty)
  }

  func testStreakDotsAreSevenOldestFirst() {
    let extras = WatchExtras.from(context: ["streakCount": 3, "streakDots": [false, false, false, false, true, true, true]])
    XCTAssertEqual(extras.streak?.count, 3)
    XCTAssertEqual(extras.streak?.dots, [false, false, false, false, true, true, true])
    XCTAssertEqual(extras.streak?.noticedToday, true)
  }

  func testShortOrLongDotListsAreFixedToSeven() {
    let short = WatchExtras.from(context: ["streakCount": 1, "streakDots": [true]])
    XCTAssertEqual(short.streak?.dots, [false, false, false, false, false, false, true])
    let long = WatchExtras.from(context: ["streakCount": 9, "streakDots": Array(repeating: true, count: 10)])
    XCTAssertEqual(long.streak?.dots.count, 7)
  }

  func testDotsMoveOnAfterMidnight() {
    var cal = Calendar(identifier: .gregorian)
    cal.timeZone = TimeZone(identifier: "UTC")!
    let synced = cal.date(from: DateComponents(year: 2026, month: 10, day: 1, hour: 9))!
    let nextDay = cal.date(from: DateComponents(year: 2026, month: 10, day: 2, hour: 8))!
    let streak = WatchStreak(count: 4, dots: [false, false, false, true, true, true, true], asOfMs: synced.timeIntervalSince1970 * 1000)
    XCTAssertEqual(streak.aligned(now: synced, calendar: cal).dots, streak.dots)
    XCTAssertEqual(streak.aligned(now: nextDay, calendar: cal).dots, [false, false, true, true, true, true, false])
    let weekLater = cal.date(from: DateComponents(year: 2026, month: 10, day: 12))!
    XCTAssertEqual(streak.aligned(now: weekLater, calendar: cal).dots, Array(repeating: false, count: 7))
  }

  func testStreakWithoutATimestampIsLeftAlone() {
    let streak = WatchStreak(count: 2, dots: [false, false, false, false, false, true, true])
    XCTAssertEqual(streak.aligned(), streak)
  }

  func testWeekdayInitialsEndOnToday() {
    var cal = Calendar(identifier: .gregorian)
    cal.timeZone = TimeZone(identifier: "UTC")!
    cal.locale = Locale(identifier: "en_US_POSIX")
    let wednesday = cal.date(from: DateComponents(year: 2026, month: 9, day: 30))!
    let streak = WatchStreak(count: 1, dots: Array(repeating: false, count: 7))
    let letters = streak.weekdayInitials(now: wednesday, calendar: cal)
    XCTAssertEqual(letters.count, 7)
    XCTAssertEqual(letters.last, "W")
    XCTAssertEqual(letters.first, "T") // six days before a Wednesday is a Thursday
  }

  func testTasksAndCategoriesAreOrderedAndSkipEmptyOnes() {
    let extras = WatchExtras.from(context: [
      "tasksTotal": 5, "tasksCompleted": 3,
      "taskCategories": ["work": [2, 3], "health": [1, 1], "learning": [0, 0]],
    ])
    XCTAssertEqual(extras.tasks?.completed, 3)
    XCTAssertEqual(extras.tasks?.categories.map(\.key), ["health", "work"])
    XCTAssertEqual(extras.tasks?.categories.map(\.label), ["Health", "Work"])
    XCTAssertEqual(extras.tasks?.share ?? 0, 0.6, accuracy: 0.001)
    XCTAssertEqual(extras.tasks?.allDone, false)
  }

  func testCounterComesFromTheContext() {
    let extras = WatchExtras.from(context: ["counterId": "c1", "counterTitle": "Water", "counterCount": 7])
    XCTAssertEqual(extras.counter, WatchCounter(id: "c1", title: "Water", count: 7))
    XCTAssertNil(WatchExtras.from(context: ["counterId": ""]).counter)
    XCTAssertEqual(WatchExtras.from(context: ["counterId": "c1", "counterCount": -3]).counter?.count, 0)
  }

  func testNoTasksIsNotAllDone() {
    let extras = WatchExtras.from(context: ["tasksTotal": 0, "tasksCompleted": 0])
    XCTAssertEqual(extras.tasks?.allDone, false)
    XCTAssertEqual(extras.tasks?.share, 0)
  }

  func testRoundTripThroughDictionary() {
    let original = WatchExtras(
      streak: WatchStreak(count: 4, dots: [false, false, false, true, true, true, true], asOfMs: 123_456),
      tasks: WatchTasks(completed: 1, total: 2, categories: [WatchTaskCategory(key: "work", completed: 1, total: 2)]),
      timer: WatchTimer(title: "Deep work", isRunning: true, startMs: 1_000, elapsedMs: 2_000),
      counter: WatchCounter(id: "c1", title: "Water", count: 5)
    )
    XCTAssertEqual(WatchExtras.from(context: original.toDictionary()), original)
  }
}

final class WatchTimerTests: XCTestCase {
  func testStoppedTimerShowsBankedTime() {
    let timer = WatchTimer(title: "T", isRunning: false, startMs: 0, elapsedMs: 125_000)
    XCTAssertEqual(timer.text(), "2:05")
    XCTAssertEqual(timer.totalMs(), 125_000)
  }

  func testRunningTimerAddsTimeSinceStart() {
    let now = Date(timeIntervalSince1970: 1_000_000)
    let timer = WatchTimer(title: "T", isRunning: true, startMs: now.timeIntervalSince1970 * 1000 - 3_723_000, elapsedMs: 0)
    XCTAssertEqual(timer.text(now: now), "1:02:03")
  }

  func testOriginLetsTheSystemCountUp() {
    let now = Date(timeIntervalSince1970: 1_000_000)
    let timer = WatchTimer(title: "T", isRunning: true, startMs: now.timeIntervalSince1970 * 1000 - 60_000, elapsedMs: 30_000)
    XCTAssertEqual(now.timeIntervalSince(timer.origin(now: now)), 90, accuracy: 0.01)
  }

  func testHourFractionWrapsEveryHour() {
    let timer = WatchTimer(title: "T", isRunning: false, startMs: 0, elapsedMs: 3_600_000 + 900_000)
    XCTAssertEqual(timer.hourFraction(), 0.25, accuracy: 0.0001)
  }
}
