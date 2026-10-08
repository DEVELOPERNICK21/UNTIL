//
//  WatchStickers.swift
//  Emoji stickers for the watch pages. Three packs per page; tapping a sticker moves to the
//  next pack. The sticker itself follows the state (time of day, season, tasks done, ...).
//

import Foundation

enum WatchPageKind: String, CaseIterable {
  case today, month, year, life, streak, tasks, counter, timer
}

enum WatchStickers {
  static let packCount = 3

  private static let table: [WatchPageKind: [[String]]] = [
    .today: [
      ["🌙", "🌅", "🌞", "🌤️", "🌇", "🌌"],
      ["😴", "🐓", "😎", "🧋", "🌆", "🦉"],
      ["🌌", "🛰️", "🚀", "🪐", "☄️", "🌠"],
    ],
    .month: [
      ["🌑", "🌒", "🌓", "🌔", "🌕"],
      ["🌱", "🌿", "🪴", "🌳", "🍎"],
      ["🛸", "🚀", "🪐", "🌍", "☄️"],
    ],
    .year: [
      ["❄️", "🌱", "🌸", "☀️", "🍂"],
      ["🎆", "🎈", "🎉", "🏖️", "🎄"],
      ["🐻", "🐣", "🐝", "🦋", "🍁"],
    ],
    .life: [
      ["👶", "🧒", "🧑", "🧔", "👴"],
      ["🌱", "🌿", "🌲", "🌳", "🍂"],
      ["💗", "💖", "❤️", "🧡", "💛"],
    ],
    .streak: [
      ["🌱", "🔥", "🔥", "🚀", "🏆"],
      ["✨", "🔥", "💥", "🌟", "👑"],
      ["🕯️", "🔥", "☄️", "🌋", "🏆"],
    ],
    .tasks: [
      ["📝", "🚀", "🔥", "⭐️", "🏆"],
      ["🥱", "🙂", "😃", "🤩", "🥳"],
      ["🌑", "🌓", "🌕", "✨", "🎉"],
    ],
    .counter: [
      ["💧", "💧", "💦", "🌊", "🏆"],
      ["☕️", "☕️", "🍵", "🧋", "🏆"],
      ["⭐️", "✨", "🌟", "💫", "🏆"],
    ],
    .timer: [
      ["🌱", "🔥", "⚡️", "🚀", "🏆"],
      ["😌", "😤", "💪", "🦾", "🦸"],
      ["⏳", "⌛️", "🔥", "💥", "⚡️"],
    ],
  ]

  static func emoji(_ kind: WatchPageKind, pack: Int, stage: Int) -> String {
    guard let packs = table[kind], !packs.isEmpty else { return "✨" }
    let list = packs[max(0, min(packs.count - 1, pack))]
    return list[max(0, min(list.count - 1, stage))]
  }

  static func nextPack(_ pack: Int) -> Int {
    (max(0, pack) + 1) % packCount
  }

  // MARK: Stages

  /// 0 night ... 5 evening, by share of the day gone.
  static func todayStage(progress: Double) -> Int {
    if progress < 0.23 { return 0 }
    if progress < 0.33 { return 1 }
    if progress < 0.55 { return 2 }
    if progress < 0.72 { return 3 }
    if progress < 0.85 { return 4 }
    return 5
  }

  static func monthStage(progress: Double) -> Int {
    min(4, max(0, Int(progress * 5)))
  }

  /// By calendar month, northern hemisphere.
  static func yearStage(month: Int) -> Int {
    switch month {
    case 12, 1, 2: return 0
    case 3, 4: return 1
    case 5: return 2
    case 6, 7, 8: return 3
    default: return 4
    }
  }

  static func lifeStage(progress: Double) -> Int {
    if progress < 0.12 { return 0 }
    if progress < 0.30 { return 1 }
    if progress < 0.55 { return 2 }
    if progress < 0.78 { return 3 }
    return 4
  }

  static func streakStage(count: Int) -> Int {
    if count < 2 { return 0 }
    if count < 7 { return 1 }
    if count < 14 { return 2 }
    if count < 30 { return 3 }
    return 4
  }

  static func tasksStage(completed: Int, total: Int) -> Int {
    if total == 0 { return 0 }
    if completed >= total { return 4 }
    let ratio = Double(completed) / Double(total)
    if ratio < 0.4 { return 1 }
    if ratio < 0.8 { return 2 }
    return 3
  }

  static func counterStage(count: Int) -> Int {
    if count <= 0 { return 0 }
    if count < 5 { return 1 }
    if count < 10 { return 2 }
    if count < 20 { return 3 }
    return 4
  }

  static func timerStage(minutes: Double) -> Int {
    if minutes < 10 { return 0 }
    if minutes < 30 { return 1 }
    if minutes < 60 { return 2 }
    if minutes < 120 { return 3 }
    return 4
  }
}
