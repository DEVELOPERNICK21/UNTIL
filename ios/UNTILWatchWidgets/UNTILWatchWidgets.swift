//
//  UNTILWatchWidgets.swift
//  UNTILWatchWidgets
//
//  Created by Nikhil on 30/07/26.
//

import WidgetKit
import SwiftUI

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), configuration: ConfigurationAppIntent())
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
        SimpleEntry(date: Date(), configuration: configuration)
    }
    
    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
        var entries: [SimpleEntry] = []

struct DayWatchProvider: TimelineProvider {
  private func resolvedCache() -> DayWatchCache {
    WatchDayStore.load() ?? DayWatchCache.fromLocalDay(WatchTimeClock.day())
  }

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
    completion(DayWatchEntry(date: Date(), cache: resolvedCache()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<DayWatchEntry>) -> Void) {
    let entry = DayWatchEntry(date: Date(), cache: resolvedCache())
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

        return Timeline(entries: entries, policy: .atEnd)
    }

    func recommendations() -> [AppIntentRecommendation<ConfigurationAppIntent>] {
        // Create an array with all the preconfigured widgets to show.
        [AppIntentRecommendation(intent: ConfigurationAppIntent(), description: "Example Widget")]
    }

//    func relevances() async -> WidgetRelevances<ConfigurationAppIntent> {
//        // Generate a list containing the contexts this widget is relevant in.
//    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationAppIntent
}

struct UNTILWatchWidgetsEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack {
            HStack {
                Text("Time:")
                Text(entry.date, style: .time)
            }
        
            Text("Favorite Emoji:")
            Text(entry.configuration.favoriteEmoji)
        }
    }
}

struct UNTILWatchWidgets: Widget {
    let kind: String = "UNTILWatchWidgets"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
            UNTILWatchWidgetsEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
    }
}

extension ConfigurationAppIntent {
    fileprivate static var smiley: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "😀"
        return intent
    }
    
    fileprivate static var starEyes: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "🤩"
        return intent
    }
}

#Preview(as: .accessoryRectangular) {
    UNTILWatchWidgets()
} timeline: {
    SimpleEntry(date: .now, configuration: .smiley)
    SimpleEntry(date: .now, configuration: .starEyes)
}    
