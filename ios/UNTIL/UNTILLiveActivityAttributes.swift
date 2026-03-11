//
//  UNTILLiveActivityAttributes.swift
//  UNTIL
//
//  Shared between main app and widget extension for Live Activity.
//

import Foundation
import ActivityKit

struct UNTILLiveActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
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
        let hourCalcElapsedMs: Int64
        let hourCalcIsRunning: Bool
        let updatedAt: Int64
    }

    var activeWidget: String // "day" | "month" | "year" | "dailyTasks" | "hourCalc" | "life"
}
