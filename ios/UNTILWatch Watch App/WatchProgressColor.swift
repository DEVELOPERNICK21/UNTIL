import Foundation

enum WatchProgressColor {
  private static let start = (r: 0x22 / 255.0, g: 0xC5 / 255.0, b: 0x5E / 255.0)
  private static let mid = (r: 0xF5 / 255.0, g: 0x9E / 255.0, b: 0x0B / 255.0)
  private static let end = (r: 0xEF / 255.0, g: 0x44 / 255.0, b: 0x44 / 255.0)

  static func rgb(for progress: Double) -> (r: Double, g: Double, b: Double) {
    let p = min(1, max(0, progress))
    let from: (r: Double, g: Double, b: Double)
    let to: (r: Double, g: Double, b: Double)
    let t: Double
    if p <= 0.5 {
      from = start
      to = mid
      t = p * 2
    } else {
      from = mid
      to = end
      t = (p - 0.5) * 2
    }
    return (
      r: from.r + (to.r - from.r) * t,
      g: from.g + (to.g - from.g) * t,
      b: from.b + (to.b - from.b) * t
    )
  }

  static func hex(for progress: Double) -> String {
    let c = rgb(for: progress)
    func byte(_ x: Double) -> Int { Int((x * 255).rounded()) }
    return String(format: "#%02X%02X%02X", byte(c.r), byte(c.g), byte(c.b))
  }
}
