import XCTest
@testable import WatchMath

final class WatchProgressColorTests: XCTestCase {
  func testStartIsGreen() {
    XCTAssertEqual(WatchProgressColor.hex(for: 0), "#22C55E")
  }

  func testMidIsAmber() {
    XCTAssertEqual(WatchProgressColor.hex(for: 0.5), "#F59E0B")
  }

  func testEndIsRed() {
    XCTAssertEqual(WatchProgressColor.hex(for: 1), "#EF4444")
  }

  func testClampsBelowZero() {
    XCTAssertEqual(WatchProgressColor.hex(for: -1), "#22C55E")
  }

  func testClampsAboveOne() {
    XCTAssertEqual(WatchProgressColor.hex(for: 2), "#EF4444")
  }

  func testQuarterIsBetweenGreenAndAmber() {
    XCTAssertEqual(WatchProgressColor.hex(for: 0.25), "#8CB235")
  }
}
