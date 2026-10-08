//
//  UNTILLiveActivityAttributes.swift
//  UNTIL
//
//  Shared between main app and widget extension for Live Activity.
//  Also holds the App Intents behind the Dynamic Island buttons: a
//  LiveActivityIntent runs in the app process, so the type has to exist in both targets.
//

import Foundation
import ActivityKit
import AppIntents
import WidgetKit
import os

struct UNTILLiveActivityAttributes: ActivityAttributes {
    /// Mutable state — includes activeWidget so type can change without restarting.
    struct ContentState: Codable, Hashable {
        var activeWidget: String // "day" | "month" | "year" | "dailyTasks" | "hourCalc" | "life"
        var dayProgress: Double
        var dayPercentDone: Int
        var dayPercentLeft: Int
        var dayHoursPassed: Double
        var dayHoursLeft: Double
        var startOfDay: Int64?
        var endOfDay: Int64?
        var monthProgress: Double
        var monthDaysPassed: Int
        var monthDaysLeft: Int
        var monthPercent: Int
        var yearProgress: Double
        var yearDaysPassed: Int
        var yearDaysLeft: Int
        var yearPercent: Int
        var lifeProgress: Double?
        var remainingDaysLife: Int?
        var lifePercent: Int?
        var dailyTasksCompleted: Int
        var dailyTasksTotal: Int
        var hourCalcTitle: String
        /// Time banked before the current run (ms).
        var hourCalcElapsedMs: Int64
        var hourCalcIsRunning: Bool
        /// When the current run began (ms since epoch). Lets the island count up by itself.
        var hourCalcStartMs: Int64?
        /// Premium (or trial) access, so locked views stay locked without reading shared storage.
        var isPremium: Bool
        /// Which sticker pack the user picked by tapping the sticker (0, 1 or 2).
        var stickerPack: Int?
        var updatedAt: Int64

        /// Same state with a different view selected (used by the island buttons).
        func with(activeWidget: String) -> ContentState {
            var next = self
            next.activeWidget = activeWidget
            return next
        }

        /// Same state with the hour timer started, stopped or reset.
        func with(hourTimerRunning: Bool, elapsedMs: Int64, startMs: Int64?) -> ContentState {
            var next = self
            next.hourCalcIsRunning = hourTimerRunning
            next.hourCalcElapsedMs = elapsedMs
            next.hourCalcStartMs = startMs
            next.updatedAt = Int64(Date().timeIntervalSince1970 * 1000)
            return next
        }

        func with(stickerPack: Int) -> ContentState {
            var next = self
            next.stickerPack = stickerPack
            return next
        }

        /// Day, month and year numbers recomputed for right now. The island buttons run this,
        /// so a tap also fixes numbers that went stale (after midnight, for example) without
        /// waiting for the app to open.
        func refreshedForNow(_ now: Date = Date()) -> ContentState {
            var next = self
            let cal = Calendar.current

            let dayStart = cal.startOfDay(for: now)
            let dayEnd = cal.date(byAdding: .day, value: 1, to: dayStart) ?? now
            let span = max(1, dayEnd.timeIntervalSince(dayStart))
            let progress = min(1, max(0, now.timeIntervalSince(dayStart) / span))
            next.startOfDay = Int64(dayStart.timeIntervalSince1970 * 1000)
            next.endOfDay = Int64(dayEnd.timeIntervalSince1970 * 1000)
            next.dayProgress = progress
            next.dayPercentDone = Int((progress * 100).rounded())
            next.dayPercentLeft = 100 - next.dayPercentDone
            next.dayHoursPassed = (progress * 24 * 10).rounded() / 10
            next.dayHoursLeft = ((1 - progress) * 24 * 10).rounded() / 10

            let dayOfMonth = cal.component(.day, from: now)
            let daysInMonth = cal.range(of: .day, in: .month, for: now)?.count ?? 30
            next.monthDaysPassed = dayOfMonth
            next.monthDaysLeft = max(0, daysInMonth - dayOfMonth)
            next.monthProgress = Double(dayOfMonth) / Double(max(1, daysInMonth))
            next.monthPercent = Int((next.monthProgress * 100).rounded())

            let dayOfYear = cal.ordinality(of: .day, in: .year, for: now) ?? 1
            let daysInYear = cal.range(of: .day, in: .year, for: now)?.count ?? 365
            next.yearDaysPassed = dayOfYear
            next.yearDaysLeft = max(0, daysInYear - dayOfYear)
            next.yearProgress = Double(dayOfYear) / Double(max(1, daysInYear))
            next.yearPercent = Int((next.yearProgress * 100).rounded())

            next.updatedAt = Int64(now.timeIntervalSince1970 * 1000)
            return next
        }
    }
}

// MARK: - Hour timer storage

/// The hour timer shared by the app, the widget, the Dynamic Island and the watch. It lives in
/// the App Group as the same JSON the app writes, and needs no ActivityKit.
enum HourTimerStore {
  static let appGroupID = "group.com.developernick.until"
  static let key = "hour.calculation.widget"
  /// Posted (in the app process) whenever a button changes the timer, so the watch can follow.
  static let changedNotification = Notification.Name("until.hourTimerChanged")

  struct State: Codable, Equatable {
    var title: String
    var isRunning: Bool
    var startTimeMs: Int64
    var totalElapsedMs: Int64

    static let idle = State(title: "Hour timer", isRunning: false, startTimeMs: 0, totalElapsedMs: 0)
  }

  static func load() -> State {
    guard let json = UserDefaults(suiteName: appGroupID)?.string(forKey: key),
          let data = json.data(using: .utf8),
          let state = try? JSONDecoder().decode(State.self, from: data)
    else { return .idle }
    return state
  }

  static func save(_ state: State) {
    guard let data = try? JSONEncoder().encode(state), let json = String(data: data, encoding: .utf8) else { return }
    UserDefaults(suiteName: appGroupID)?.set(json, forKey: key)
  }

  /// Start when stopped, stop (banking the time) when running.
  static func toggled(_ state: State, nowMs: Int64) -> State {
    var next = state
    if state.isRunning {
      next.totalElapsedMs += max(0, nowMs - state.startTimeMs)
      next.startTimeMs = 0
      next.isRunning = false
    } else {
      next.startTimeMs = nowMs
      next.isRunning = true
    }
    return next
  }

  static func reset(_ state: State) -> State {
    var next = state
    next.isRunning = false
    next.startTimeMs = 0
    next.totalElapsedMs = 0
    return next
  }
}

// MARK: - Dynamic Island actions

/// What the island buttons do. Kept out of the intents so both can share it.
@available(iOS 16.2, *)
enum IslandActions {
    static let appGroupID = "group.com.developernick.until"
    /// Read by the React Native side on the next foreground so its chosen view matches.
    static let widgetTypeKey = "liveActivity.widgetType"
    static let stickerPackKey = "liveActivity.stickerPack"
    static let stickerPackCount = 3
    static let validModes: Set<String> = ["day", "month", "year", "life", "dailyTasks", "hourCalc"]

    /// Views that need Premium, matching the in-app gating.
    static let premiumModes: Set<String> = ["month", "life"]

    static let log = Logger(subsystem: "com.developernick.until", category: "island")

    /// Activities that can still be updated. Ended and dismissed ones are skipped.
    static var liveActivities: [Activity<UNTILLiveActivityAttributes>] {
        Activity<UNTILLiveActivityAttributes>.activities.filter {
            $0.activityState == .active || $0.activityState == .stale
        }
    }

    /// Update the island first so the tap feels instant, then do the bookkeeping.
    static func switchMode(to mode: String) async {
        guard validModes.contains(mode) else { return }
        let started = Date()
        for activity in liveActivities {
            let content = activity.content
            // A free user can not reach Month or Life from the island.
            if premiumModes.contains(mode) && !content.state.isPremium { continue }
            await activity.update(
                ActivityContent(
                    state: content.state.with(activeWidget: mode).refreshedForNow(),
                    staleDate: content.staleDate
                )
            )
        }
        UserDefaults(suiteName: appGroupID)?.set(mode, forKey: widgetTypeKey)
        log.debug("switch to \(mode, privacy: .public) took \(Int(Date().timeIntervalSince(started) * 1000)) ms")
    }

    /// Next sticker pack, remembered so the app's own updates keep it.
    static func cycleSticker() async {
        let started = Date()
        let defaults = UserDefaults(suiteName: appGroupID)
        let current = liveActivities.first?.content.state.stickerPack
            ?? defaults?.integer(forKey: stickerPackKey)
            ?? 0
        let next = (current + 1) % stickerPackCount
        for activity in liveActivities {
            let content = activity.content
            await activity.update(
                ActivityContent(
                    state: content.state.with(stickerPack: next).refreshedForNow(),
                    staleDate: content.staleDate
                )
            )
        }
        defaults?.set(next, forKey: stickerPackKey)
        log.debug("sticker pack \(next) took \(Int(Date().timeIntervalSince(started) * 1000)) ms")
    }

    /// The timer as the island shows it. The buttons act on this, so what a person sees is what
    /// changes. The shared copy is only the fallback when no island is running.
    private static func currentHourState() -> HourTimerStore.State {
        if let shown = liveActivities.first?.content.state {
            return HourTimerStore.State(
                title: shown.hourCalcTitle,
                isRunning: shown.hourCalcIsRunning,
                startTimeMs: shown.hourCalcStartMs ?? 0,
                totalElapsedMs: shown.hourCalcElapsedMs
            )
        }
        return HourTimerStore.load()
    }

    /// Push the timer state to the island first, then save it for the app and the widget.
    private static func publish(_ state: HourTimerStore.State) async {
        for activity in liveActivities {
            let content = activity.content
            await activity.update(
                ActivityContent(
                    state: content.state.with(
                        hourTimerRunning: state.isRunning,
                        elapsedMs: state.totalElapsedMs,
                        startMs: state.isRunning ? state.startTimeMs : nil
                    ),
                    staleDate: content.staleDate
                )
            )
        }
        HourTimerStore.save(state)
        WidgetCenter.shared.reloadTimelines(ofKind: "UNTILHourCalculationWidget")
        NotificationCenter.default.post(name: HourTimerStore.changedNotification, object: nil)
    }

    /// Start or stop the hour timer. Same JSON the widget and the app use.
    static func toggleHourTimer() async {
        let started = Date()
        let next = HourTimerStore.toggled(currentHourState(), nowMs: Int64(Date().timeIntervalSince1970 * 1000))
        await publish(next)
        log.debug("timer toggle took \(Int(Date().timeIntervalSince(started) * 1000)) ms")
    }

    /// Stop the hour timer and clear the time.
    static func resetHourTimer() async {
        await publish(HourTimerStore.reset(currentHourState()))
    }
}

@available(iOS 17.0, *)
struct SwitchIslandModeIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Switch Dynamic Island view"
    static var description = IntentDescription("Choose what the Dynamic Island shows.")
    static var isDiscoverable: Bool { false }

    @Parameter(title: "View")
    var mode: String

    init() {
        self.mode = "day"
    }

    init(mode: String) {
        self.mode = mode
    }

    func perform() async throws -> some IntentResult {
        await IslandActions.switchMode(to: mode)
        return .result()
    }
}

@available(iOS 17.0, *)
struct ToggleIslandTimerIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Start or stop hour timer"
    static var description = IntentDescription("Start or stop the hour timer from the Dynamic Island.")
    static var isDiscoverable: Bool { false }

    init() {}

    func perform() async throws -> some IntentResult {
        await IslandActions.toggleHourTimer()
        return .result()
    }
}

@available(iOS 17.0, *)
struct ResetIslandTimerIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Reset hour timer"
    static var description = IntentDescription("Stop the hour timer and clear its time.")
    static var isDiscoverable: Bool { false }

    init() {}

    func perform() async throws -> some IntentResult {
        await IslandActions.resetHourTimer()
        return .result()
    }
}

@available(iOS 17.0, *)
struct CycleIslandStickerIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Change Dynamic Island sticker"
    static var description = IntentDescription("Switch to the next sticker pack.")
    static var isDiscoverable: Bool { false }

    init() {}

    func perform() async throws -> some IntentResult {
        await IslandActions.cycleSticker()
        return .result()
    }
}
