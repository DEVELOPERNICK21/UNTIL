//
//  LiveActivityBridge.swift
//  UNTIL
//

import Foundation
import React
import ActivityKit

@objc(LiveActivityBridge)
class LiveActivityBridge: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func startActivity(_ stateJson: String) {
    guard #available(iOS 16.2, *) else { return }
    guard let state = parseState(stateJson) else { return }
    let attrs = UNTILLiveActivityAttributes(activeWidget: state.activeWidget)
    let contentState = UNTILLiveActivityAttributes.ContentState(
      dayProgress: state.dayProgress,
      dayPercentDone: state.dayPercentDone,
      dayPercentLeft: state.dayPercentLeft,
      dayHoursPassed: state.dayHoursPassed,
      dayHoursLeft: state.dayHoursLeft,
      startOfDay: state.startOfDay,
      endOfDay: state.endOfDay,
      monthProgress: state.monthProgress,
      monthDaysPassed: state.monthDaysPassed,
      monthDaysLeft: state.monthDaysLeft,
      monthPercent: state.monthPercent,
      yearProgress: state.yearProgress,
      yearDaysPassed: state.yearDaysPassed,
      yearDaysLeft: state.yearDaysLeft,
      yearPercent: state.yearPercent,
      lifeProgress: state.lifeProgress,
      remainingDaysLife: state.remainingDaysLife,
      lifePercent: state.lifePercent,
      dailyTasksCompleted: state.dailyTasksCompleted,
      dailyTasksTotal: state.dailyTasksTotal,
      hourCalcTitle: state.hourCalcTitle,
      hourCalcElapsedMs: state.hourCalcElapsedMs,
      hourCalcIsRunning: state.hourCalcIsRunning,
      updatedAt: state.updatedAt
    )
    Task {
      do {
        _ = try Activity.request(
          attributes: attrs,
          content: .init(state: contentState, staleDate: nil),
          pushType: nil
        )
      } catch {
        // Activity may already be running; try update instead
        await updateActivity(stateJson)
      }
    }
  }

  @objc func updateActivity(_ stateJson: String) {
    guard #available(iOS 16.2, *) else { return }
    guard let state = parseState(stateJson) else { return }
    let contentState = UNTILLiveActivityAttributes.ContentState(
      dayProgress: state.dayProgress,
      dayPercentDone: state.dayPercentDone,
      dayPercentLeft: state.dayPercentLeft,
      dayHoursPassed: state.dayHoursPassed,
      dayHoursLeft: state.dayHoursLeft,
      startOfDay: state.startOfDay,
      endOfDay: state.endOfDay,
      monthProgress: state.monthProgress,
      monthDaysPassed: state.monthDaysPassed,
      monthDaysLeft: state.monthDaysLeft,
      monthPercent: state.monthPercent,
      yearProgress: state.yearProgress,
      yearDaysPassed: state.yearDaysPassed,
      yearDaysLeft: state.yearDaysLeft,
      yearPercent: state.yearPercent,
      lifeProgress: state.lifeProgress,
      remainingDaysLife: state.remainingDaysLife,
      lifePercent: state.lifePercent,
      dailyTasksCompleted: state.dailyTasksCompleted,
      dailyTasksTotal: state.dailyTasksTotal,
      hourCalcTitle: state.hourCalcTitle,
      hourCalcElapsedMs: state.hourCalcElapsedMs,
      hourCalcIsRunning: state.hourCalcIsRunning,
      updatedAt: state.updatedAt
    )
    Task {
      for activity in Activity<UNTILLiveActivityAttributes>.activities {
        await activity.update(ActivityContent(state: contentState, staleDate: nil))
      }
    }
  }

  @objc func endActivity() {
    guard #available(iOS 16.2, *) else { return }
    Task {
      for activity in Activity<UNTILLiveActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }

  @objc func isActivityActive(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 16.2, *) else {
      resolve(false)
      return
    }
    let active = !Activity<UNTILLiveActivityAttributes>.activities.isEmpty
    resolve(active)
  }

  private func parseState(_ json: String) -> LiveActivityState? {
    guard let data = json.data(using: .utf8),
          let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      return nil
    }
    let num = { (key: String) -> Double? in
      guard let v = obj[key] else { return nil }
      if let n = v as? Double { return n }
      if let n = v as? Int { return Double(n) }
      return nil
    }
    let int = { (key: String) -> Int? in
      guard let v = obj[key] else { return nil }
      if let n = v as? Int { return n }
      if let n = v as? Double { return Int(n) }
      return nil
    }
    let int64 = { (key: String) -> Int64? in
      guard let v = obj[key] else { return nil }
      if let n = v as? Int64 { return n }
      if let n = v as? Int { return Int64(n) }
      if let n = v as? Double { return Int64(n) }
      return nil
    }
    return LiveActivityState(
      activeWidget: obj["activeWidget"] as? String ?? "day",
      dayProgress: num("dayProgress") ?? 0,
      dayPercentDone: int("dayPercentDone") ?? 0,
      dayPercentLeft: int("dayPercentLeft") ?? (100 - (int("dayPercentDone") ?? 0)),
      dayHoursPassed: num("dayHoursPassed") ?? 0,
      dayHoursLeft: num("dayHoursLeft") ?? 0,
      startOfDay: int64("startOfDay"),
      endOfDay: int64("endOfDay"),
      monthProgress: num("monthProgress") ?? 0,
      monthDaysPassed: int("monthDaysPassed") ?? 0,
      monthDaysLeft: int("monthDaysLeft") ?? 0,
      monthPercent: int("monthPercent") ?? 0,
      yearProgress: num("yearProgress") ?? 0,
      yearDaysPassed: int("yearDaysPassed") ?? 0,
      yearDaysLeft: int("yearDaysLeft") ?? 0,
      yearPercent: int("yearPercent") ?? 0,
      lifeProgress: num("lifeProgress"),
      remainingDaysLife: int("remainingDaysLife"),
      lifePercent: int("lifePercent"),
      dailyTasksCompleted: int("dailyTasksCompleted") ?? 0,
      dailyTasksTotal: int("dailyTasksTotal") ?? 0,
      hourCalcTitle: obj["hourCalcTitle"] as? String ?? "Hour timer",
      hourCalcElapsedMs: int64("hourCalcElapsedMs") ?? 0,
      hourCalcIsRunning: obj["hourCalcIsRunning"] as? Bool ?? false,
      updatedAt: int64("updatedAt") ?? Int64(Date().timeIntervalSince1970 * 1000)
    )
  }
}

private struct LiveActivityState {
  let activeWidget: String
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
