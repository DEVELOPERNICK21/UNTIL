//
//  UNTILWidgets.swift
//  UNTILWidgets
//

import SwiftUI
import WidgetKit

// MARK: - Widget Cache Model
struct WidgetCache: Codable {
    let dayProgress: Double
    let dayPercentDone: Int
    let dayPercentLeft: Int
    let dayHoursPassed: Double
    let dayHoursLeft: Double
    let monthProgress: Double
    let monthDaysPassed: Int
    let monthDaysLeft: Int
    let monthPercent: Int
    let yearProgress: Double
    let yearDaysPassed: Int
    let yearDaysLeft: Int
    let yearPercent: Int
    let updatedAt: Int64
}

// MARK: - Design Tokens
private enum Design {
    static let background = Color(red: 0x0E/255, green: 0x0E/255, blue: 0x10/255)
    static let passed = Color(red: 0xAA/255, green: 0x22/255, blue: 0x22/255)
    static let left = Color(red: 0x22/255, green: 0xAA/255, blue: 0x22/255)
    static let percent = Color(red: 0xE8/255, green: 0x7C/255, blue: 0x20/255)
    static let labelSize: CGFloat = 12
    static let valueSize: CGFloat = 18
}

// MARK: - Widget Provider
struct UNTILWidgetProvider: TimelineProvider {
    private func loadWidgetCache() -> WidgetCache? {
        guard let json = WidgetCacheReader.loadJSON() else { return nil }
        guard let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WidgetCache.self, from: data)
    }

    func placeholder(in context: Context) -> UNTILWidgetEntry {
        UNTILWidgetEntry(date: Date(), cache: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (UNTILWidgetEntry) -> Void) {
        let cache = loadWidgetCache()
        completion(UNTILWidgetEntry(date: Date(), cache: cache))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<UNTILWidgetEntry>) -> Void) {
        let cache = loadWidgetCache()
        let entry = UNTILWidgetEntry(date: Date(), cache: cache)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct UNTILWidgetEntry: TimelineEntry {
    let date: Date
    let cache: WidgetCache?
}

// MARK: - Day Widget View
struct DayWidgetView: View {
    let entry: UNTILWidgetEntry

    var body: some View {
        Group {
            if let cache = entry.cache {
                VStack(alignment: .leading, spacing: 6) {
                    Text("\(cache.dayPercentDone)% day done")
                        .font(.system(size: Design.labelSize, weight: .medium))
                        .foregroundColor(Design.passed)
                    Text("\(cache.dayPercentLeft)% day left")
                        .font(.system(size: Design.labelSize, weight: .medium))
                        .foregroundColor(Design.left)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.gray.opacity(0.3))
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Design.percent)
                                .frame(width: geo.size.width * cache.dayProgress)
                        }
                    }
                    .frame(height: 6)
                }
                .padding()
            } else {
                placeholderView
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(Design.background)
        .containerBackground(Design.background, for: .widget)
    }

    private var placeholderView: some View {
        Text("Open UNTIL to sync")
            .font(.system(size: Design.labelSize))
            .foregroundColor(.gray)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Month Widget View
struct MonthWidgetView: View {
    let entry: UNTILWidgetEntry

    var body: some View {
        Group {
            if let cache = entry.cache {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("\(cache.monthDaysPassed)d passed")
                            .font(.system(size: Design.labelSize, weight: .medium))
                            .foregroundColor(Design.passed)
                        Spacer()
                        Text("\(cache.monthDaysLeft)d left")
                            .font(.system(size: Design.labelSize, weight: .medium))
                            .foregroundColor(Design.left)
                    }
                    Text("\(cache.monthPercent)% of month")
                        .font(.system(size: Design.valueSize, weight: .semibold))
                        .foregroundColor(Design.percent)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.gray.opacity(0.3))
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Design.percent)
                                .frame(width: geo.size.width * cache.monthProgress)
                        }
                    }
                    .frame(height: 6)
                }
                .padding()
            } else {
                placeholderView
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(Design.background)
        .containerBackground(Design.background, for: .widget)
    }

    private var placeholderView: some View {
        Text("Open UNTIL to sync")
            .font(.system(size: Design.labelSize))
            .foregroundColor(.gray)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Year Widget View
struct YearWidgetView: View {
    let entry: UNTILWidgetEntry

    var body: some View {
        Group {
            if let cache = entry.cache {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("\(cache.yearDaysPassed)d passed")
                            .font(.system(size: Design.labelSize, weight: .medium))
                            .foregroundColor(Design.passed)
                        Spacer()
                        Text("\(cache.yearDaysLeft)d left")
                            .font(.system(size: Design.labelSize, weight: .medium))
                            .foregroundColor(Design.left)
                    }
                    Text("\(cache.yearPercent)% of year")
                        .font(.system(size: Design.valueSize, weight: .semibold))
                        .foregroundColor(Design.percent)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.gray.opacity(0.3))
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Design.percent)
                                .frame(width: geo.size.width * cache.yearProgress)
                        }
                    }
                    .frame(height: 6)
                    Divider().background(Color.gray.opacity(0.5))
                    HStack {
                        Text("\(cache.dayPercentDone)% day done")
                            .font(.system(size: Design.labelSize - 2, weight: .medium))
                            .foregroundColor(Design.passed)
                        Spacer()
                        Text("\(cache.dayPercentLeft)% day left")
                            .font(.system(size: Design.labelSize - 2, weight: .medium))
                            .foregroundColor(Design.left)
                    }
                }
                .padding()
            } else {
                placeholderView
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(Design.background)
        .containerBackground(Design.background, for: .widget)
    }

    private var placeholderView: some View {
        Text("Open UNTIL to sync")
            .font(.system(size: Design.labelSize))
            .foregroundColor(.gray)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Widget Configurations
struct DayWidget: Widget {
    let kind: String = "UNTILDayWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: UNTILWidgetProvider()) { entry in
            DayWidgetView(entry: entry)
        }
        .configurationDisplayName("UNTIL Day")
        .description("See your day progress.")
        .supportedFamilies([.systemSmall])
    }
}

struct MonthWidget: Widget {
    let kind: String = "UNTILMonthWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: UNTILWidgetProvider()) { entry in
            MonthWidgetView(entry: entry)
        }
        .configurationDisplayName("UNTIL Month")
        .description("See your month progress.")
        .supportedFamilies([.systemMedium])
    }
}

struct YearWidget: Widget {
    let kind: String = "UNTILYearWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: UNTILWidgetProvider()) { entry in
            YearWidgetView(entry: entry)
        }
        .configurationDisplayName("UNTIL Year")
        .description("See your year and day progress.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - Widget Bundle
@main
struct UNTILWidgetsBundle: WidgetBundle {
    var body: some Widget {
        DayWidget()
        MonthWidget()
        YearWidget()
    }
}
