import Foundation

struct WatchProfile: Equatable {
  var birthDate: String
  var deathAge: Int
}

enum WatchProfileStore {
  static let birthKey = "until.watch.profile.birthDate"
  static let deathKey = "until.watch.profile.deathAge"
  static let defaultDeathAge = 80

  private static var defaults: UserDefaults {
    UserDefaults(suiteName: DayWatchCache.suiteName) ?? .standard
  }

  static func load() -> WatchProfile? {
    guard let birth = defaults.string(forKey: birthKey)?.trimmingCharacters(in: .whitespacesAndNewlines),
          !birth.isEmpty
    else { return nil }
    var death = defaults.integer(forKey: deathKey)
    if death <= 0 { death = defaultDeathAge }
    return WatchProfile(birthDate: birth, deathAge: death)
  }

  static func save(birthDate: String, deathAge: Int) {
    let trimmed = birthDate.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    let age = deathAge <= 0 ? defaultDeathAge : deathAge
    defaults.set(trimmed, forKey: birthKey)
    defaults.set(age, forKey: deathKey)
  }

  static func save(fromContext context: [String: Any]) {
    guard let birth = context["birthDate"] as? String else { return }
    let death: Int
    if let n = context["deathAge"] as? NSNumber {
      death = n.intValue
    } else if let i = context["deathAge"] as? Int {
      death = i
    } else {
      death = defaultDeathAge
    }
    save(birthDate: birth, deathAge: death)
  }
}
