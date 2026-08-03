import XCTest
@testable import WatchMath

final class WatchLifeClockTests: XCTestCase {
  func testNilProfileReturnsNil() {
    XCTAssertNil(WatchLifeClock.snapshot(profile: nil))
  }

  func testInvalidBirthReturnsNil() {
    XCTAssertNil(WatchLifeClock.snapshot(profile: WatchProfile(birthDate: "bad", deathAge: 80)))
  }

  func testValidProfileProducesPercent() {
    let profile = WatchProfile(birthDate: "1990-01-01", deathAge: 80)
    let snap = WatchLifeClock.snapshot(
      profile: profile,
      now: Calendar.current.date(from: DateComponents(year: 2026, month: 7, day: 20))!
    )
    XCTAssertNotNil(snap)
    XCTAssertTrue((0...100).contains(snap!.percentDone))
    XCTAssertTrue(snap!.remainingLabel.contains("y left"))
  }

  func testNonPositiveDeathAgeFallsBackTo80() {
    let profile = WatchProfile(birthDate: "2000-01-01", deathAge: 0)
    let snap = WatchLifeClock.snapshot(profile: profile)
    XCTAssertNotNil(snap)
  }
}
