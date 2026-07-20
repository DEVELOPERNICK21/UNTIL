//
//  UNTILWatchWidgets.swift
//  UNTILWatchWidgets — circular Day % complication.
//

import SwiftUI
import WidgetKit

private let kindDayWatch = "UNTILDayWatchComplication"

struct DayWatchEntry: TimelineEntry {
  let date: Date
  let cache: DayWatchCache?
}

struct DayWatchProvider: TimelineProvider {
  func placeholder(in context: Context) -> DayWatchEntry {
    DayWatchEntry(
      date: Date(),
      cache: DayWatchCache(
        dayProgress: 0.37,
        dayPercentDone: 37,
        dayPercentLeft: 63,
        startOfDay: nil,
        endOfDay: nil,
        dayHoursLeft: 15,
        dayRemainingMinutes: 900,
        updatedAt: Date().timeIntervalSince1970 * 1000
      )
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (DayWatchEntry) -> Void) {
    completion(DayWatchEntry(date: Date(), cache: WatchDayStore.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<DayWatchEntry>) -> Void) {
    let entry = DayWatchEntry(date: Date(), cache: WatchDayStore.load())
    let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date())
      ?? Date().addingTimeInterval(900)
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

struct DayWatchCircularView: View {
  let entry: DayWatchEntry

  private var passed: Color { Color(hex: DayWatchDesign.passed) }
  private var left: Color { Color(hex: DayWatchDesign.left) }
  private var percent: Color { Color(hex: DayWatchDesign.percent) }
  private var label: Color { Color(hex: DayWatchDesign.label) }

  var body: some View {
    Group {
      if let cache = entry.cache {
        ZStack {
          Circle()
            .stroke(left, lineWidth: 5)
          Circle()
            .trim(from: 0, to: cache.progressClamped)
            .stroke(passed, style: StrokeStyle(lineWidth: 5, lineCap: .round))
            .rotationEffect(.degrees(-90))
          VStack(spacing: 0) {
            Text("DAY")
              .font(.caption2.weight(.medium))
              .foregroundColor(label)
              .minimumScaleFactor(0.6)
              .lineLimit(1)
            Text("\(cache.dayPercentDone)%")
              .font(.headline.weight(.bold))
              .foregroundColor(percent)
              .minimumScaleFactor(0.5)
              .lineLimit(1)
          }
        }
        .padding(4)
      } else {
        VStack(spacing: 2) {
          Text("DAY")
            .font(.caption2.weight(.medium))
            .foregroundColor(label)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
          Text("—")
            .font(.headline.weight(.bold))
            .foregroundColor(percent)
            .minimumScaleFactor(0.5)
            .lineLimit(1)
        }
      }
    }
    .containerBackground(for: .widget) {
      AccessoryWidgetBackground()
    }
    .widgetURL(URL(string: "untilwatch://day"))
  }
}

struct UNTILDayWatchWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kindDayWatch, provider: DayWatchProvider()) { entry in
      DayWatchCircularView(entry: entry)
    }
    .configurationDisplayName("UNTIL Day")
    .description("Day progress from UNTIL.")
    .supportedFamilies([.accessoryCircular])
  }
}

@main
struct UNTILWatchWidgetsBundle: WidgetBundle {
  var body: some Widget {
    UNTILDayWatchWidget()
  }
}
