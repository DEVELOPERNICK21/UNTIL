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

struct UNTILLiveActivityAttributes: ActivityAttributes {
    /// Mutable state — includes activeWidget so type can change without restarting.
    struct ContentState: Codable, Hashable {
        let activeWidget: String // "day" | "month" | "year" | "dailyTasks" | "hourCalc" | "life"
        let dayProgress: Double
        let dayPercentDone: Int
        let dayPercentLeft: Int
        let dayHoursPassed: Double
        let dayHoursLeft: Double
        let startOfDay: Int64?
        let endOfDay: Int64?
        let monthProgress: Double
        let monthDaysPassed: Int
        let monthDaysLeft: Int
        let monthPercent: Int
        let yearProgress: Double
        let yearDaysPassed: Int
        let yearDaysLeft: Int
        let yearPercent: Int
        let lifeProgress: Double?
        let remainingDaysLife: Int?
        let lifePercent: Int?
        let dailyTasksCompleted: Int
        let dailyTasksTotal: Int
        let hourCalcTitle: String
        /// Time banked before the current run (ms).
        let hourCalcElapsedMs: Int64
        let hourCalcIsRunning: Bool
        /// When the current run began (ms since epoch). Lets the island count up by itself.
        let hourCalcStartMs: Int64?
        /// Premium (or trial) access, so locked views stay locked without reading shared storage.
        let isPremium: Bool
        let updatedAt: Int64

        /// Same state with a different view selected (used by the island buttons).
        func with(activeWidget: String) -> ContentState {
            ContentState(
                activeWidget: activeWidget,
                dayProgress: dayProgress,
                dayPercentDone: dayPercentDone,
                dayPercentLeft: dayPercentLeft,
                dayHoursPassed: dayHoursPassed,
                dayHoursLeft: dayHoursLeft,
                startOfDay: startOfDay,
                endOfDay: endOfDay,
                monthProgress: monthProgress,
                monthDaysPassed: monthDaysPassed,
                monthDaysLeft: monthDaysLeft,
                monthPercent: monthPercent,
                yearProgress: yearProgress,
                yearDaysPassed: yearDaysPassed,
                yearDaysLeft: yearDaysLeft,
                yearPercent: yearPercent,
                lifeProgress: lifeProgress,
                remainingDaysLife: remainingDaysLife,
                lifePercent: lifePercent,
                dailyTasksCompleted: dailyTasksCompleted,
                dailyTasksTotal: dailyTasksTotal,
                hourCalcTitle: hourCalcTitle,
                hourCalcElapsedMs: hourCalcElapsedMs,
                hourCalcIsRunning: hourCalcIsRunning,
                hourCalcStartMs: hourCalcStartMs,
                isPremium: isPremium,
                updatedAt: updatedAt
            )
        }

        /// Same state with the hour timer started or stopped.
        func with(hourTimerRunning: Bool, elapsedMs: Int64, startMs: Int64?) -> ContentState {
            ContentState(
                activeWidget: activeWidget,
                dayProgress: dayProgress,
                dayPercentDone: dayPercentDone,
                dayPercentLeft: dayPercentLeft,
                dayHoursPassed: dayHoursPassed,
                dayHoursLeft: dayHoursLeft,
                startOfDay: startOfDay,
                endOfDay: endOfDay,
                monthProgress: monthProgress,
                monthDaysPassed: monthDaysPassed,
                monthDaysLeft: monthDaysLeft,
                monthPercent: monthPercent,
                yearProgress: yearProgress,
                yearDaysPassed: yearDaysPassed,
                yearDaysLeft: yearDaysLeft,
                yearPercent: yearPercent,
                lifeProgress: lifeProgress,
                remainingDaysLife: remainingDaysLife,
                lifePercent: lifePercent,
                dailyTasksCompleted: dailyTasksCompleted,
                dailyTasksTotal: dailyTasksTotal,
                hourCalcTitle: hourCalcTitle,
                hourCalcElapsedMs: elapsedMs,
                hourCalcIsRunning: hourTimerRunning,
                hourCalcStartMs: startMs,
                isPremium: isPremium,
                updatedAt: Int64(Date().timeIntervalSince1970 * 1000)
            )
        }
    }
}

// MARK: - Dynamic Island actions

/// What the island buttons do. Kept out of the intents so both can share it.
@available(iOS 16.2, *)
enum IslandActions {
    static let appGroupID = "group.com.developernick.until"
    /// Read by the React Native side on the next foreground so its chosen view matches.
    static let widgetTypeKey = "liveActivity.widgetType"
    static let hourCalculationKey = "hour.calculation.widget"
    static let validModes: Set<String> = ["day", "month", "year", "life", "dailyTasks", "hourCalc"]

    /// Views that need Premium, matching the in-app gating.
    static let premiumModes: Set<String> = ["month", "life"]

    static func switchMode(to mode: String) async {
        guard validModes.contains(mode) else { return }
        UserDefaults(suiteName: appGroupID)?.set(mode, forKey: widgetTypeKey)
        for activity in Activity<UNTILLiveActivityAttributes>.activities {
            let content = activity.content
            // A free user can not reach Month or Life from the island.
            if premiumModes.contains(mode) && !content.state.isPremium { continue }
            await activity.update(
                ActivityContent(
                    state: content.state.with(activeWidget: mode),
                    staleDate: content.staleDate
                )
            )
        }
    }

    private struct HourState: Codable {
        var title: String
        var isRunning: Bool
        var startTimeMs: Int64
        var totalElapsedMs: Int64
    }

    /// Start or stop the hour timer. Same JSON the widget and the app use.
    static func toggleHourTimer() async {
        let defaults = UserDefaults(suiteName: appGroupID)
        let nowMs = Int64(Date().timeIntervalSince1970 * 1000)

        var state = HourState(title: "Hour timer", isRunning: false, startTimeMs: 0, totalElapsedMs: 0)
        if let json = defaults?.string(forKey: hourCalculationKey),
           let data = json.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(HourState.self, from: data) {
            state = decoded
        }

        if state.isRunning {
            state.totalElapsedMs += max(0, nowMs - state.startTimeMs)
            state.startTimeMs = 0
            state.isRunning = false
        } else {
            state.startTimeMs = nowMs
            state.isRunning = true
        }

        if let data = try? JSONEncoder().encode(state),
           let json = String(data: data, encoding: .utf8) {
            defaults?.set(json, forKey: hourCalculationKey)
        }

        for activity in Activity<UNTILLiveActivityAttributes>.activities {
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
        WidgetCenter.shared.reloadTimelines(ofKind: "UNTILHourCalculationWidget")
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
