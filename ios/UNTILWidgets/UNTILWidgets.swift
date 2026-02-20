//
//  UNTILWidgets.swift
//  UNTILWidgets
//

import SwiftUI
import WidgetKit

// MARK: - Widget Cache Model (mirrors dataContract.WidgetCache)
struct WidgetCache: Codable {
    let dayProgress: Double
    let dayPercentDone: Int
    let dayPercentLeft: Int
    let dayHoursPassed: Double
    let dayHoursLeft: Double
    let dayPassedMinutes: Int?
    let dayRemainingMinutes: Int?
    let monthProgress: Double
    let monthIndex: Int?
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
    static let passed = Color(red: 0xFF/255, green: 0x3B/255, blue: 0x30/255)      // #FF3B30 red
    static let left = Color(red: 0x34/255, green: 0xC7/255, blue: 0x59/255)        // #34C759 green
    static let percent = Color(red: 0xE9/255, green: 0xA2/255, blue: 0x3A/255)     // #E9A23A orange/gold
    static let progressOrange = Color(red: 0xE8/255, green: 0x7C/255, blue: 0x20/255) // #E87C20
    static let passedDot = Color(red: 0xBB/255, green: 0x86/255, blue: 0xFC/255)   // #BB86FC purple
    static let currentDot = Color(red: 0xE8/255, green: 0x7C/255, blue: 0x20/255)  // #E87C20 orange
    static let remainingDot = Color(red: 0x66/255, green: 0x66/255, blue: 0x66/255) // #666666 gray
    static let grayLabel = Color(red: 0xAA/255, green: 0xAA/255, blue: 0xAA/255)   // #AAAAAA
    static let lightText = Color(red: 0xEE/255, green: 0xEE/255, blue: 0xEE/255)     // #EEEEEE
    static let progressBg = Color(red: 0x44/255, green: 0x44/255, blue: 0x44/255)  // #444444
    static let labelSize: CGFloat = 12
    static let valueSize: CGFloat = 18
    static let bigPercentSize: CGFloat = 20
    static let smallLabelSize: CGFloat = 11
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

// MARK: - Day Dots View (circular ring + 24 hour dots)
private struct DayDotsView: View {
    let progress: Double

    private let totalDots = 24
    private let dotRadius: CGFloat = 2.4
    private let currentDotRadius: CGFloat = 3.2
    private let ringStroke: CGFloat = 10
    /// Dots sit outside the ring so they don't overlap the progress bar
    private let dotRingOffset: CGFloat = 14

    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let center = size / 2
            let ringRadius = center - ringStroke / 2 - 4
            let passedHours = Int(progress * Double(totalDots))
            let hasCurrentHour = progress < 1.0 && passedHours < totalDots
            let currentHour = hasCurrentHour ? passedHours : -1

            ZStack {
                // Background ring
                Circle()
                    .stroke(Design.progressBg, lineWidth: ringStroke)
                    .frame(width: ringRadius * 2, height: ringRadius * 2)
                    .position(x: center, y: center)

                // Progress arc (start at top)
                Circle()
                    .trim(from: 0, to: CGFloat(min(progress, 0.9999)))
                    .stroke(Design.passedDot, style: StrokeStyle(lineWidth: ringStroke, lineCap: .round))
                    .frame(width: ringRadius * 2, height: ringRadius * 2)
                    .rotationEffect(.degrees(-90))
                    .position(x: center, y: center)

                // 24 hour dots around the ring
                ForEach(0..<totalDots, id: \.self) { i in
                    let angle = Angle.degrees(-90 + Double(i) * 360.0 / Double(totalDots))
                    let dotRadiusToUse: CGFloat = (i == currentHour && currentHour >= 0) ? currentDotRadius : dotRadius
                    let dotColor: Color = {
                        if i < passedHours { return Design.passedDot }
                        if i == currentHour && currentHour >= 0 { return Design.currentDot }
                        return Design.remainingDot
                    }()
                    Circle()
                        .fill(dotColor)
                        .frame(width: dotRadiusToUse * 2, height: dotRadiusToUse * 2)
                        .position(
                            x: center + (ringRadius + dotRingOffset) * CGFloat(cos(angle.radians)),
                            y: center + (ringRadius + dotRingOffset) * CGFloat(sin(angle.radians))
                        )
                }

                // Orange knob at progress end
                if progress > 0 && progress < 1.0 {
                    let knobAngle = Angle.degrees(-90 + progress * 360)
                    Circle()
                        .fill(Design.currentDot)
                        .frame(width: 9, height: 9)
                        .position(
                            x: center + ringRadius * CGFloat(cos(knobAngle.radians)),
                            y: center + ringRadius * CGFloat(sin(knobAngle.radians))
                        )
                }
            }
        }
        .aspectRatio(1, contentMode: .fit)
    }
}

// MARK: - Month Dots View (12 dots = Jan..Dec; current dot = current month)
private struct MonthDotsView: View {
    let progress: Double
    /// Current month 1–12 from cache (Jan=1, Feb=2). If nil, fallback to progress-based guess.
    let monthIndex: Int?

    private let totalDots = 12
    private let cols = 6
    private let rows = 2
    private let dotRadius: CGFloat = 6.5
    private let currentDotRadius: CGFloat = 10.4
    private let gap: CGFloat = 8

    var body: some View {
        let idx = (monthIndex ?? 1).clamped(to: 1...12)
        let currentMonth = idx - 1
        let passedMonths = currentMonth

        VStack(spacing: gap) {
            ForEach(0..<rows, id: \.self) { row in
                HStack(spacing: gap) {
                    ForEach(0..<cols, id: \.self) { col in
                        let i = row * cols + col
                        let radius = (i == currentMonth) ? currentDotRadius : dotRadius
                        let color: Color = {
                            if i < passedMonths { return Design.passedDot }
                            if i == currentMonth { return Design.currentDot }
                            return Design.remainingDot
                        }()
                        Circle()
                            .fill(color)
                            .frame(width: radius * 2, height: radius * 2)
                    }
                }
            }
        }
    }
}

private extension Comparable {
    func clamped(to range: ClosedRange<Self>) -> Self {
        min(max(self, range.lowerBound), range.upperBound)
    }
}

// MARK: - Year Dots View (365 dots; fits inside given bounds with insets, no clipping)
private struct YearDotsView: View {
    let progress: Double
    let yearDaysPassed: Int
    var availableWidth: CGFloat = 0
    var availableHeight: CGFloat = 0
    /// Horizontal inset so dots don't touch widget edges
    private let horizontalInset: CGFloat = 8

    private let totalDots = 365
    private let cols = 30
    private var rows: Int { (totalDots + cols - 1) / cols }
    private let dotRadius: CGFloat = 3.5
    private let currentDotRadius: CGFloat = 4.5
    private let gap: CGFloat = 4

    private var contentWidth: CGFloat {
        max(0, availableWidth - horizontalInset * 2)
    }

    private var cellSize: CGFloat {
        guard contentWidth > 0 else { return dotRadius * 2 }
        let totalGap = CGFloat(cols - 1) * gap
        return max(2, (contentWidth - totalGap) / CGFloat(cols))
    }

    private var gridWidth: CGFloat {
        let size = cellSize
        return CGFloat(cols) * size + CGFloat(cols - 1) * gap
    }

    private var gridHeight: CGFloat {
        let size = cellSize
        return CGFloat(rows) * size + CGFloat(rows - 1) * gap
    }

    private var scaleToFit: CGFloat {
        guard availableHeight > 0, gridHeight > 0, availableWidth > 0 else { return 1 }
        let scaleH = availableHeight / gridHeight
        let scaleW = contentWidth / gridWidth
        return min(1, scaleH, scaleW)
    }

    var body: some View {
        let passedDots = min(yearDaysPassed, totalDots)
        let hasCurrentDay = progress < 1.0 && passedDots < totalDots
        let currentDay = hasCurrentDay ? passedDots : -1
        let size = cellSize
        let scale = scaleToFit

        LazyVGrid(columns: Array(repeating: GridItem(.fixed(size), spacing: gap), count: cols), spacing: gap) {
            ForEach(0..<totalDots, id: \.self) { i in
                let radius = (i == currentDay && currentDay >= 0) ? min(currentDotRadius, size / 2) : min(dotRadius, size / 2)
                let color: Color = {
                    if i < passedDots { return Design.passedDot }
                    if i == currentDay && currentDay >= 0 { return Design.currentDot }
                    return Design.remainingDot
                }()
                Circle()
                    .fill(color)
                    .frame(width: radius * 2, height: radius * 2)
            }
        }
        .frame(width: gridWidth, height: gridHeight)
        .scaleEffect(scale, anchor: .center)
        .frame(width: contentWidth, height: availableHeight)
        .clipped()
    }
}

// MARK: - Day Ring View (circular progress ring only, no dots - for large padded layout)
private struct DayRingView: View {
    let progress: Double
    var size: CGFloat = 120

    private let ringStroke: CGFloat = 14

    var body: some View {
        let ringRadius = size / 2 - ringStroke / 2 - 4
        let center = size / 2

        ZStack {
            // Background ring
            Circle()
                .stroke(Design.progressBg, lineWidth: ringStroke)
                .frame(width: ringRadius * 2, height: ringRadius * 2)

            // Progress arc (start at top)
            Circle()
                .trim(from: 0, to: CGFloat(min(progress, 0.9999)))
                .stroke(Design.passedDot, style: StrokeStyle(lineWidth: ringStroke, lineCap: .round))
                .frame(width: ringRadius * 2, height: ringRadius * 2)
                .rotationEffect(.degrees(-90))

            // Orange knob at progress end
            if progress > 0 && progress < 1.0 {
                let knobAngle = Angle.degrees(-90 + progress * 360)
                ZStack {
                    Circle()
                        .fill(Design.currentDot)
                        .frame(width: 16, height: 16)
                        .shadow(color: .black.opacity(0.3), radius: 2, x: 0, y: 1)
                }
                .offset(
                    x: ringRadius * CGFloat(cos(knobAngle.radians)),
                    y: ringRadius * CGFloat(sin(knobAngle.radians))
                )
            }
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Day Metrics View (right side metrics for large layout)
private struct DayMetricsView: View {
    let cache: WidgetCache

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Progress metric (highlighted)
            VStack(alignment: .leading, spacing: 4) {
                Text("PROGRESS")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Design.grayLabel)
                    .textCase(.uppercase)
                Text("\(cache.dayPercentDone)%")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(Design.passedDot)
            }

            // Time passed
            VStack(alignment: .leading, spacing: 4) {
                Text("PASSED")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Design.grayLabel)
                    .textCase(.uppercase)
                Text(dayTimePassedText(cache))
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(Design.lightText)
            }

            // Time left
            VStack(alignment: .leading, spacing: 4) {
                Text("LEFT")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Design.grayLabel)
                    .textCase(.uppercase)
                Text(dayTimeLeftText(cache))
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(Design.lightText)
            }
        }
    }

    private func dayTimePassedText(_ cache: WidgetCache) -> String {
        if let pm = cache.dayPassedMinutes {
            let h = pm / 60, m = pm % 60
            return m > 0 ? "\(h)h \(m)m" : "\(h)h"
        }
        return "\(Int(cache.dayHoursPassed))h"
    }

    private func dayTimeLeftText(_ cache: WidgetCache) -> String {
        if let rm = cache.dayRemainingMinutes {
            let h = rm / 60, m = rm % 60
            return m > 0 ? "\(h)h \(m)m" : "\(h)h"
        }
        return "\(Int(cache.dayHoursLeft))h"
    }
}

// MARK: - Day Widget View
struct DayWidgetView: View {
    let entry: UNTILWidgetEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if let cache = entry.cache {
                switch family {
                case .systemLarge:
                    // Padded layout: circular ring left, metrics right (inspired by image pattern)
                    HStack(spacing: 24) {
                        DayRingView(progress: cache.dayProgress, size: 140)
                            .padding(.leading, 8)

                        Spacer()

                        DayMetricsView(cache: cache)
                            .padding(.trailing, 8)
                    }
                    .padding(.vertical, 20)
                    .padding(.horizontal, 20)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                case .systemSmall:
                    // Compact layout: circular ring with dots, minimal text
                    VStack(spacing: 10) {
                        DayDotsView(progress: cache.dayProgress)
                            .frame(maxWidth: .infinity)
                            .layoutPriority(1)

                        Text("\(cache.dayPercentDone)%")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(Design.percent)
                    }
                    .padding(20)

                default: // .systemMedium
                    // Standard layout: circular ring with dots, full metrics
                    VStack(spacing: 14) {
                        DayDotsView(progress: cache.dayProgress)
                            .frame(maxWidth: .infinity)
                            .layoutPriority(1)

                        HStack(spacing: 10) {
                            Text("\(cache.dayPercentDone)% Done")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(Design.passed)
                            Text("\(cache.dayPercentLeft)% Left")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(Design.left)
                        }

                        HStack(spacing: 10) {
                            Text(dayTimePassedText(cache))
                                .font(.system(size: 13))
                                .foregroundColor(Design.grayLabel)
                            Text(dayTimeLeftText(cache))
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(Design.lightText)
                        }
                    }
                    .padding(20)
                }
            } else {
                placeholderView
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }

    private func dayTimePassedText(_ cache: WidgetCache) -> String {
        if let pm = cache.dayPassedMinutes {
            let h = pm / 60, m = pm % 60
            return m > 0 ? "\(h)h \(m)m passed" : "\(h)h passed"
        }
        return "\(Int(cache.dayHoursPassed))h passed"
    }

    private func dayTimeLeftText(_ cache: WidgetCache) -> String {
        if let rm = cache.dayRemainingMinutes {
            let h = rm / 60, m = rm % 60
            return m > 0 ? "\(h)h \(m)m left" : "\(h)h left"
        }
        return "\(Int(cache.dayHoursLeft))h left"
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
                VStack(spacing: 12) {
                    MonthDotsView(progress: cache.monthProgress, monthIndex: cache.monthIndex)
                        .frame(maxWidth: .infinity)
                        .layoutPriority(1)

                    HStack(spacing: 8) {
                        Text("\(cache.monthDaysPassed) Days Passed")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(Design.passed)
                        Text("\(cache.monthDaysLeft) Days Left")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(Design.left)
                    }

                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Design.progressBg)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Design.passedDot)
                                .frame(width: geo.size.width * cache.monthProgress)
                        }
                    }
                    .frame(height: 8)

                    Text("\(cache.monthPercent)%")
                        .font(.system(size: Design.bigPercentSize, weight: .bold))
                        .foregroundColor(Design.percent)
                    Text("of month")
                        .font(.system(size: Design.smallLabelSize))
                        .foregroundColor(Design.grayLabel)
                }
                .padding(16)
            } else {
                placeholderView
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
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
                let consumedPct = Int(cache.yearProgress * 100)
                let leftPct = 100 - consumedPct

                VStack(spacing: 14) {
                    GeometryReader { geo in
                        YearDotsView(progress: cache.yearProgress, yearDaysPassed: cache.yearDaysPassed, availableWidth: geo.size.width, availableHeight: geo.size.height)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 140)
                    .layoutPriority(1)

                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Design.progressBg)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Design.progressOrange)
                                .frame(width: geo.size.width * cache.yearProgress)
                        }
                    }
                    .frame(height: 10)

                    HStack(spacing: 8) {
                        Text("\(cache.yearDaysPassed)d passed (\(consumedPct)%)")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(Design.passed)
                        Text("\(cache.yearDaysLeft)d left (\(leftPct)%)")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(Design.left)
                    }

                    Text("\(consumedPct)%")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(Design.percent)
                    Text("of year")
                        .font(.system(size: 13))
                        .foregroundColor(Design.grayLabel)
                }
                .padding(20)
            } else {
                placeholderView
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }

    private var placeholderView: some View {
        Text("Open UNTIL to sync")
            .font(.system(size: Design.labelSize))
            .foregroundColor(.gray)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Shared widget background (edge-to-edge, no strips)
private extension View {
    func widgetBackground() -> some View {
        background(Design.background.ignoresSafeArea())
        .containerBackground(Design.background, for: .widget)
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
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
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
        .supportedFamilies([.systemLarge])
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
