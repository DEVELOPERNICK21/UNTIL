import Foundation

struct PeriodSnapshot: Equatable {
  var progress: Double
  var percentDone: Int
  var percentLeft: Int
  var remainingLabel: String
  var passedLabel: String
  var updatedAt: TimeInterval

  var progressClamped: Double {
    min(1, max(0, progress))
  }
}
