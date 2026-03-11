//
//  UNTILWidgets.swift
//  UNTILWidgets
//

import SwiftUI
import WidgetKit
import AppIntents
import ActivityKit

// MARK: - Widget Cache Model (mirrors dataContract.WidgetCache)
struct WidgetCache: Codable {
    let dayProgress: Double
    let dayPercentDone: Int
    let dayPercentLeft: Int
    let dayHoursPassed: Double
    let dayHoursLeft: Double
    let dayPassedMinutes: Int?
    let dayRemainingMinutes: Int?
    /// Start of current day (Unix ms). Used with current time for realtime seconds.
    let startOfDay: Int64?
    /// End of current day (Unix ms).
    let endOfDay: Int64?
    let monthProgress: Double
    let monthIndex: Int?
    let monthDaysPassed: Int
    let monthDaysLeft: Int
    let monthPercent: Int
    let yearProgress: Double
    let yearDaysPassed: Int
    let yearDaysLeft: Int
    let yearPercent: Int
    /// Life progress 0–1. Present only when birth date is set.
    let lifeProgress: Double?
    /// Remaining days until death age.
    let remainingDaysLife: Int?
    /// Life percent 0–100.
    let lifePercent: Int?
    let updatedAt: Int64

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        dayProgress = try c.decode(Double.self, forKey: .dayProgress)
        dayPercentDone = try c.decode(Int.self, forKey: .dayPercentDone)
        dayPercentLeft = try c.decode(Int.self, forKey: .dayPercentLeft)
        dayHoursPassed = try c.decode(Double.self, forKey: .dayHoursPassed)
        dayHoursLeft = try c.decode(Double.self, forKey: .dayHoursLeft)
        dayPassedMinutes = try c.decodeIfPresent(Int.self, forKey: .dayPassedMinutes)
        dayRemainingMinutes = try c.decodeIfPresent(Int.self, forKey: .dayRemainingMinutes)
        startOfDay = try c.decodeIfPresent(Int64.self, forKey: .startOfDay)
        endOfDay = try c.decodeIfPresent(Int64.self, forKey: .endOfDay)
        monthProgress = try c.decode(Double.self, forKey: .monthProgress)
        monthIndex = try c.decodeIfPresent(Int.self, forKey: .monthIndex)
        monthDaysPassed = try c.decode(Int.self, forKey: .monthDaysPassed)
        monthDaysLeft = try c.decode(Int.self, forKey: .monthDaysLeft)
        monthPercent = try c.decode(Int.self, forKey: .monthPercent)
        yearProgress = try c.decode(Double.self, forKey: .yearProgress)
        yearDaysPassed = try c.decode(Int.self, forKey: .yearDaysPassed)
        yearDaysLeft = try c.decode(Int.self, forKey: .yearDaysLeft)
        yearPercent = try c.decode(Int.self, forKey: .yearPercent)
        lifeProgress = try c.decodeIfPresent(Double.self, forKey: .lifeProgress)
        remainingDaysLife = try c.decodeIfPresent(Int.self, forKey: .remainingDaysLife)
        lifePercent = try c.decodeIfPresent(Int.self, forKey: .lifePercent)
        updatedAt = try c.decode(Int64.self, forKey: .updatedAt)
    }
}

// MARK: - Design Tokens
private enum Design {
    static let background = Color.black
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
/// Shared provider for widgets that don't need per-second or per-minute updates.
/// Used when a dedicated provider (Day, MonthYear, etc.) is more appropriate.
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
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 1, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

/// Month and Year widgets: refresh at start of next day (midnight) since values change daily.
struct MonthYearWidgetProvider: TimelineProvider {
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
        let cal = Calendar.current
        let startOfToday = cal.startOfDay(for: Date())
        let nextUpdate = cal.date(byAdding: .day, value: 1, to: startOfToday) ?? startOfToday
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
}

/// Day widget only: uses multiple timeline entries (one per second) so passed/left time shows seconds in realtime
/// without relying on the system re-calling getTimeline every second (which is throttled).
struct DayWidgetProvider: TimelineProvider {
    private static let entriesPerTimeline = 60

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
        let calendar = Calendar.current
        let now = Date()
        var entries: [UNTILWidgetEntry] = []
        for offset in 0..<Self.entriesPerTimeline {
            guard let date = calendar.date(byAdding: .second, value: offset, to: now) else { continue }
            entries.append(UNTILWidgetEntry(date: date, cache: cache))
        }
        let nextRefresh = calendar.date(byAdding: .second, value: Self.entriesPerTimeline, to: now) ?? now
        let timeline = Timeline(entries: entries, policy: .after(nextRefresh))
        completion(timeline)
    }
}

struct UNTILWidgetEntry: TimelineEntry {
    let date: Date
    let cache: WidgetCache?
}

// MARK: - Daily Tasks Widget (day report: completed / total)
struct DailyTaskCategoryStats: Codable {
    let completed: Int
    let total: Int
}

struct DailyTaskWidgetPayload: Codable {
    let date: String
    let completed: Int
    let total: Int
    let pending: Int
    let byCategory: [String: DailyTaskCategoryStats]?
}

struct DailyTasksWidgetEntry: TimelineEntry {
    let date: Date
    let payload: DailyTaskWidgetPayload?
    /// Used for .systemLarge: day progress section.
    let dayCache: WidgetCache?
}

struct DailyTasksWidgetProvider: TimelineProvider {
    private func loadPayload() -> DailyTaskWidgetPayload? {
        guard let json = WidgetCacheReader.loadDailyTasksStatsJSON(),
              let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(DailyTaskWidgetPayload.self, from: data)
    }

    private func loadWidgetCache() -> WidgetCache? {
        guard let json = WidgetCacheReader.loadJSON() else { return nil }
        guard let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WidgetCache.self, from: data)
    }

    func placeholder(in context: Context) -> DailyTasksWidgetEntry {
        DailyTasksWidgetEntry(date: Date(), payload: nil, dayCache: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (DailyTasksWidgetEntry) -> Void) {
        completion(DailyTasksWidgetEntry(date: Date(), payload: loadPayload(), dayCache: loadWidgetCache()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyTasksWidgetEntry>) -> Void) {
        let now = Date()
        let entry = DailyTasksWidgetEntry(date: now, payload: loadPayload(), dayCache: loadWidgetCache())
        // Refresh at next minute boundary so task data and day time (minutes) stay in sync
        let cal = Calendar.current
        var comps = cal.dateComponents([.year, .month, .day, .hour, .minute], from: now)
        guard let startOfCurrentMinute = cal.date(from: comps) else {
            completion(Timeline(entries: [entry], policy: .after(cal.date(byAdding: .minute, value: 1, to: now)!)))
            return
        }
        let nextUpdate = cal.date(byAdding: .minute, value: 1, to: startOfCurrentMinute) ?? startOfCurrentMinute
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
}

private let dailyTasksCategoryLabels: [String: String] = [
    "health": "Health",
    "work": "Work",
    "personal_care": "Personal care",
    "learning": "Learning",
    "other": "Other",
]

private struct DailyTasksPieShape: View {
    let completed: Int
    let total: Int
    let size: CGFloat
    let innerRatio: CGFloat

    private var progress: Double {
        guard total > 0 else { return 0 }
        return Double(completed) / Double(total)
    }

    var body: some View {
        ZStack {
            if total > 0 {
                if progress >= 1.0 {
                    Circle()
                        .fill(Design.left)
                    Circle()
                        .fill(Design.background)
                        .scaleEffect(innerRatio)
                } else {
                    let start = Angle.degrees(-90)
                    let end = start + Angle.degrees(360 * progress)
                    DailyTasksDonutSectorShape(startAngle: start, endAngle: end, innerRatio: innerRatio)
                        .fill(Design.left)
                    DailyTasksDonutSectorShape(startAngle: end, endAngle: start + .degrees(360), innerRatio: innerRatio)
                        .fill(Design.progressOrange)
                }
            } else {
                Circle()
                    .stroke(Design.progressBg, lineWidth: 4)
            }
        }
        .frame(width: size, height: size)
        .drawingGroup()
    }
}

/// Donut sector that sizes itself from the view's rect so the pie renders correctly.
private struct DailyTasksDonutSectorShape: Shape {
    let startAngle: Angle
    let endAngle: Angle
    let innerRatio: CGFloat

    func path(in rect: CGRect) -> Path {
        let w = rect.width
        let h = rect.height
        guard w > 0, h > 0 else { return Path() }
        let cx = rect.midX
        let cy = rect.midY
        let rOuter = (min(w, h) / 2) - 2
        let rInner = rOuter * innerRatio
        var p = Path()
        let startOuter = CGPoint(x: cx + rOuter * CGFloat(cos(startAngle.radians)), y: cy + rOuter * CGFloat(sin(startAngle.radians)))
        let endInner = CGPoint(x: cx + rInner * CGFloat(cos(endAngle.radians)), y: cy + rInner * CGFloat(sin(endAngle.radians)))
        p.move(to: startOuter)
        p.addArc(center: CGPoint(x: cx, y: cy), radius: rOuter, startAngle: startAngle, endAngle: endAngle, clockwise: false)
        p.addLine(to: endInner)
        p.addArc(center: CGPoint(x: cx, y: cy), radius: rInner, startAngle: endAngle, endAngle: startAngle, clockwise: false)
        p.closeSubpath()
        return p
    }
}

/// Compact day block for the large Daily Tasks widget (Tasks + Day in one).
private struct DailyTasksDaySection: View {
    let cache: WidgetCache
    var now: Date = Date()

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Rectangle()
                .fill(Design.progressBg)
                .frame(height: 1)
                .padding(.vertical, 4)
            Text("TODAY")
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(Design.grayLabel)
                .tracking(1.2)
            HStack(spacing: 16) {
                Text("\(cache.dayPercentDone)% done")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(Design.passedDot)
                Text("·")
                    .foregroundColor(Design.grayLabel)
                Text(dayTimePassedText(cache, now: now))
                    .font(.system(size: 13))
                    .foregroundColor(Design.grayLabel)
                Text("passed")
                    .font(.system(size: 11))
                    .foregroundColor(Design.grayLabel)
                Text(dayTimeLeftText(cache, now: now))
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(Design.lightText)
                Text("left")
                    .font(.system(size: 11))
                    .foregroundColor(Design.grayLabel)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Design.progressBg)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Design.passedDot)
                        .frame(width: max(0, geo.size.width * CGFloat(cache.dayProgress)), height: 6)
                }
            }
            .frame(height: 6)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct DailyTasksWidgetView: View {
    let entry: DailyTasksWidgetEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if family == .systemLarge {
                VStack(alignment: .leading, spacing: 0) {
                    if let p = entry.payload {
                        paddedContent(payload: p)
                    } else {
                        placeholderView
                    }
                    if let cache = entry.dayCache {
                        DailyTasksDaySection(cache: cache, now: entry.date)
                    }
                }
            } else {
                if let p = entry.payload {
                    paddedContent(payload: p)
                } else {
                    placeholderView
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }

    private func paddedContent(payload: DailyTaskWidgetPayload) -> some View {
        let total = payload.total
        let completed = payload.completed
        let pending = payload.pending
        let progress = total > 0 ? Double(completed) / Double(total) : 0.0
        let pct = total > 0 ? Int(round(progress * 100)) : 0

        return VStack(alignment: .leading, spacing: 0) {
            Text("TODAY'S TASKS")
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(Design.grayLabel)
                .tracking(1.2)
                .padding(.bottom, 12)

            HStack(alignment: .center, spacing: 16) {
                DailyTasksPieShape(completed: completed, total: total, size: family == .systemSmall ? 72 : 88, innerRatio: 0.58)
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(completed)/\(total)")
                        .font(.system(size: family == .systemSmall ? 22 : 26, weight: .bold))
                        .foregroundColor(Design.lightText)
                    Text("done")
                        .font(.system(size: 12))
                        .foregroundColor(Design.grayLabel)
                    if total > 0 {
                        Text("\(pct)% · \(pending) pending")
                            .font(.system(size: 11))
                            .foregroundColor(Design.grayLabel)
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.bottom, 12)

            if total > 0 {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Design.progressBg)
                        RoundedRectangle(cornerRadius: 4)
                            .fill(progress >= 1.0 ? Design.left : Design.progressOrange)
                            .frame(width: max(0, geo.size.width * CGFloat(progress)))
                    }
                }
                .frame(height: 8)
                .padding(.bottom, 10)
            }

            if family != .systemSmall, let byCat = payload.byCategory, !byCat.isEmpty {
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(Array(byCat.keys.sorted()), id: \.self) { key in
                        if let stats = byCat[key], stats.total > 0 {
                            let label = dailyTasksCategoryLabels[key] ?? key
                            Text("\(label) \(stats.completed)/\(stats.total)")
                                .font(.system(size: 11))
                                .foregroundColor(Design.grayLabel)
                        }
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .padding(20)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    private var placeholderView: some View {
        Text("Add tasks in Until")
            .font(.system(size: Design.labelSize))
            .foregroundColor(Design.grayLabel)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(20)
    }
}

struct DailyTasksWidget: Widget {
    let kind: String = "UNTILDailyTasksWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyTasksWidgetProvider()) { entry in
            DailyTasksWidgetView(entry: entry)
        }
        .configurationDisplayName("Daily tasks")
        .description("Tasks and day in one. Small/medium: tasks. Large: tasks + day. Add tasks in Until.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
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

// MARK: - Day time strings (hours and minutes only; no seconds)
private func dayTimePassedText(_ cache: WidgetCache, now: Date = Date()) -> String {
    if let start = cache.startOfDay, let end = cache.endOfDay {
        let startSec = Double(start) / 1000
        let nowSec = now.timeIntervalSince1970
        let passedSec = max(0, min(Int(nowSec - startSec), Int(Double(end - start) / 1000)))
        let h = passedSec / 3600
        let m = (passedSec % 3600) / 60
        let s = passedSec % 60
        return "\(h)h \(m)m \(s)s"
    }
    if let pm = cache.dayPassedMinutes {
        let h = pm / 60, m = pm % 60
        return "\(h)h \(m)m 0s"
    }
    return "\(Int(cache.dayHoursPassed))h 0m 0s"
}

private func dayTimeLeftText(_ cache: WidgetCache, now: Date = Date()) -> String {
    if let start = cache.startOfDay, let end = cache.endOfDay {
        let endSec = Double(end) / 1000
        let nowSec = now.timeIntervalSince1970
        let remainingSec = max(0, Int(endSec - nowSec))
        let h = remainingSec / 3600
        let m = (remainingSec % 3600) / 60
        let s = remainingSec % 60
        return "\(h)h \(m)m \(s)s"
    }
    if let rm = cache.dayRemainingMinutes {
        let h = rm / 60, m = rm % 60
        return "\(h)h \(m)m 0s"
    }
    return "\(Int(cache.dayHoursLeft))h 0m 0s"
}

// MARK: - Day Metrics View (right side metrics for large layout)
private struct DayMetricsView: View {
    let cache: WidgetCache
    /// Use entry date for realtime seconds; nil falls back to cache-only.
    var now: Date = Date()

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("PROGRESS")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Design.grayLabel)
                    .textCase(.uppercase)
                Text("\(cache.dayPercentDone)%")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(Design.passedDot)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("PASSED")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Design.grayLabel)
                    .textCase(.uppercase)
                Text(dayTimePassedText(cache, now: now))
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(Design.lightText)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("LEFT")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Design.grayLabel)
                    .textCase(.uppercase)
                Text(dayTimeLeftText(cache, now: now))
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(Design.lightText)
            }
        }
    }
}

// MARK: - Lock Screen Accessory Views (accessoryInline, accessoryCircular, accessoryRectangular)
private struct DayAccessoryInlineView: View {
    let cache: WidgetCache
    var now: Date = Date()

    var body: some View {
        Text("\(cache.dayPercentDone)% done · \(dayTimeLeftText(cache, now: now)) left")
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(Design.lightText)
    }
}

private struct DayAccessoryCircularView: View {
    let cache: WidgetCache

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 2) {
                Text("\(cache.dayPercentDone)%")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(Design.passedDot)
                Text("day")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Design.grayLabel)
            }
        }
    }
}

private struct DayAccessoryRectangularView: View {
    let cache: WidgetCache
    var now: Date = Date()

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Today")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Design.grayLabel)
            HStack {
                Text("\(cache.dayPercentDone)% done")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(Design.passed)
                Spacer()
                Text("\(cache.dayPercentLeft)% left")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(Design.left)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Design.progressBg)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Design.progressOrange)
                        .frame(width: max(0, geo.size.width * CGFloat(cache.dayProgress)))
                }
            }
            .frame(height: 6)
        }
    }
}

private struct MonthAccessoryInlineView: View {
    let cache: WidgetCache

    var body: some View {
        Text("Month \(cache.monthPercent)% · \(cache.monthDaysLeft)d left")
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(Design.lightText)
    }
}

private struct MonthAccessoryCircularView: View {
    let cache: WidgetCache

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 2) {
                Text("\(cache.monthPercent)%")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(Design.percent)
                Text("month")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Design.grayLabel)
            }
        }
    }
}

private struct MonthAccessoryRectangularView: View {
    let cache: WidgetCache

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Month")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Design.grayLabel)
            HStack {
                Text("\(cache.monthDaysPassed)d passed")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(Design.passed)
                Spacer()
                Text("\(cache.monthDaysLeft)d left")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(Design.left)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Design.progressBg)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Design.progressOrange)
                        .frame(width: max(0, geo.size.width * CGFloat(cache.monthProgress)))
                }
            }
            .frame(height: 6)
        }
    }
}

private struct YearAccessoryInlineView: View {
    let cache: WidgetCache

    var body: some View {
        Text("Year \(cache.yearPercent)% · \(cache.yearDaysLeft)d left")
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(Design.lightText)
    }
}

private struct YearAccessoryCircularView: View {
    let cache: WidgetCache

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 2) {
                Text("\(cache.yearPercent)%")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(Design.percent)
                Text("year")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Design.grayLabel)
            }
        }
    }
}

private struct YearAccessoryRectangularView: View {
    let cache: WidgetCache

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Year")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Design.grayLabel)
            HStack {
                Text("\(cache.yearDaysPassed)d passed")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(Design.passed)
                Spacer()
                Text("\(cache.yearDaysLeft)d left")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(Design.left)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Design.progressBg)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Design.progressOrange)
                        .frame(width: max(0, geo.size.width * CGFloat(cache.yearProgress)))
                }
            }
            .frame(height: 6)
        }
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
                case .accessoryInline:
                    DayAccessoryInlineView(cache: cache, now: entry.date)
                case .accessoryCircular:
                    DayAccessoryCircularView(cache: cache)
                case .accessoryRectangular:
                    DayAccessoryRectangularView(cache: cache, now: entry.date)
                case .systemLarge:
                    HStack(spacing: 24) {
                        DayRingView(progress: cache.dayProgress, size: 140)
                            .padding(.leading, 8)

                        Spacer()

                        DayMetricsView(cache: cache, now: entry.date)
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
                            Text(dayTimePassedText(cache, now: entry.date))
                                .font(.system(size: 13))
                                .foregroundColor(Design.grayLabel)
                            Text(dayTimeLeftText(cache, now: entry.date))
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

    private var placeholderView: some View {
        Text("Open Until to sync")
            .font(.system(size: Design.labelSize))
            .foregroundColor(.gray)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Month Widget View
struct MonthWidgetView: View {
    let entry: UNTILWidgetEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if let cache = entry.cache {
                switch family {
                case .accessoryInline:
                    MonthAccessoryInlineView(cache: cache)
                case .accessoryCircular:
                    MonthAccessoryCircularView(cache: cache)
                case .accessoryRectangular:
                    MonthAccessoryRectangularView(cache: cache)
                default:
                    monthContent(cache: cache)
                }
            } else {
                placeholderView
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }

    private func monthContent(cache: WidgetCache) -> some View {
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
    }

    private var placeholderView: some View {
        Text("Open Until to sync")
            .font(.system(size: Design.labelSize))
            .foregroundColor(.gray)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Year Widget View
struct YearWidgetView: View {
    let entry: UNTILWidgetEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if let cache = entry.cache {
                switch family {
                case .accessoryInline:
                    YearAccessoryInlineView(cache: cache)
                case .accessoryCircular:
                    YearAccessoryCircularView(cache: cache)
                case .accessoryRectangular:
                    YearAccessoryRectangularView(cache: cache)
                default:
                    yearContent(cache: cache)
                }
            } else {
                placeholderView
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }

    private func yearContent(cache: WidgetCache) -> some View {
        let consumedPct = Int(cache.yearProgress * 100)
        let leftPct = 100 - consumedPct

        return VStack(spacing: 14) {
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
    }

    private var placeholderView: some View {
        Text("Open Until to sync")
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

// MARK: - Counter Widget (tap to increment)
struct CounterWidgetEntry: TimelineEntry {
    let date: Date
    let counter: CustomCounterItem?
}

struct CounterWidgetProvider: TimelineProvider {
    private func loadFirstCounter() -> CustomCounterItem? {
        guard let json = WidgetCacheReader.loadCustomCountersJSON(),
              let data = json.data(using: .utf8) else { return nil }
        guard let list = try? JSONDecoder().decode([CustomCounterItem].self, from: data),
              let first = list.first else { return nil }
        return first
    }

    func placeholder(in context: Context) -> CounterWidgetEntry {
        CounterWidgetEntry(date: Date(), counter: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (CounterWidgetEntry) -> Void) {
        completion(CounterWidgetEntry(date: Date(), counter: loadFirstCounter()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CounterWidgetEntry>) -> Void) {
        let entry = CounterWidgetEntry(date: Date(), counter: loadFirstCounter())
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 1, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
}

// MARK: - Increment Counter App Intent (runs in widget extension; tap increments without opening app)
struct IncrementCounterIntent: AppIntent {
    static var title: LocalizedStringResource = "Increment counter"
    static var openAppWhenRun: Bool { false }

    @Parameter(title: "Counter ID")
    var counterId: String

    init(counterId: String) {
        self.counterId = counterId
    }

    init() {
        self.counterId = ""
    }

    func perform() async throws -> some IntentResult {
        guard let json = WidgetCacheReader.loadCustomCountersJSON(),
              let data = json.data(using: .utf8),
              var list = try? JSONDecoder().decode([CustomCounterItem].self, from: data),
              let idx = list.firstIndex(where: { $0.id == counterId }) else {
            return .result()
        }
        list[idx] = CustomCounterItem(id: list[idx].id, title: list[idx].title, count: list[idx].count + 1)
        if let encoded = try? JSONEncoder().encode(list),
           let newJson = String(data: encoded, encoding: .utf8) {
            WidgetCacheReader.writeCustomCountersJSON(newJson)
        }
        WidgetCenter.shared.reloadTimelines(ofKind: "UNTILCounterWidget")
        return .result()
    }
}

private struct CounterWidgetView: View {
    let entry: CounterWidgetEntry

    var body: some View {
        Group {
            if let c = entry.counter {
                Button(intent: IncrementCounterIntent(counterId: c.id)) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(c.title)
                            .font(.system(size: Design.labelSize, weight: .semibold))
                            .foregroundColor(Design.lightText)
                        Text("\(c.count)")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(Design.passedDot)
                        Spacer(minLength: 0)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                    .padding(16)
                }
                .buttonStyle(.plain)
            } else {
                VStack(spacing: 8) {
                    Text("Add a counter in Until")
                        .font(.system(size: Design.labelSize))
                        .foregroundColor(Design.grayLabel)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }
}

struct CounterWidget: Widget {
    let kind: String = "UNTILCounterWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CounterWidgetProvider()) { entry in
            CounterWidgetView(entry: entry)
        }
        .configurationDisplayName("Counter")
        .description("Tap to add +1. Create counters in Until → Widgets → Custom counters.")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - Countdown Widget (days left until deadline)
private func daysLeft(from dateString: String) -> Int {
    let parts = dateString.split(separator: "-").compactMap { Int($0) }
    guard parts.count >= 3 else { return 0 }
    let cal = Calendar.current
    guard let target = cal.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2])) else { return 0 }
    let startOfToday = cal.startOfDay(for: Date())
    let startOfTarget = cal.startOfDay(for: target)
    let days = cal.dateComponents([.day], from: startOfToday, to: startOfTarget).day ?? 0
    return max(0, days)
}

private func countdownSubtitle(days: Int) -> String {
    if days == 0 { return "Today" }
    if days == 1 { return "1 day left" }
    return "\(days) days left"
}

struct CountdownWidgetEntry: TimelineEntry {
    let date: Date
    let countdown: CountdownItem?
    let daysLeft: Int
}

struct CountdownWidgetProvider: TimelineProvider {
    private func loadFirstCountdown() -> (CountdownItem, Int)? {
        guard let json = WidgetCacheReader.loadCountdownsJSON(),
              let data = json.data(using: .utf8),
              let list = try? JSONDecoder().decode([CountdownItem].self, from: data),
              let first = list.first else { return nil }
        return (first, daysLeft(from: first.date))
    }

    func placeholder(in context: Context) -> CountdownWidgetEntry {
        CountdownWidgetEntry(date: Date(), countdown: nil, daysLeft: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (CountdownWidgetEntry) -> Void) {
        if let (item, days) = loadFirstCountdown() {
            completion(CountdownWidgetEntry(date: Date(), countdown: item, daysLeft: days))
        } else {
            completion(CountdownWidgetEntry(date: Date(), countdown: nil, daysLeft: 0))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CountdownWidgetEntry>) -> Void) {
        let entry: CountdownWidgetEntry
        if let (item, days) = loadFirstCountdown() {
            entry = CountdownWidgetEntry(date: Date(), countdown: item, daysLeft: days)
        } else {
            entry = CountdownWidgetEntry(date: Date(), countdown: nil, daysLeft: 0)
        }
        let nextUpdate = Calendar.current.date(byAdding: .day, value: 1, to: Calendar.current.startOfDay(for: Date())) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
}

private struct CountdownWidgetView: View {
    let entry: CountdownWidgetEntry

    var body: some View {
        Group {
            if let c = entry.countdown {
                VStack(alignment: .leading, spacing: 8) {
                    Text(c.title)
                        .font(.system(size: Design.labelSize, weight: .semibold))
                        .foregroundColor(Design.lightText)
                    Text(countdownSubtitle(days: entry.daysLeft))
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(Design.passedDot)
                    Spacer(minLength: 0)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .padding(16)
            } else {
                VStack(spacing: 8) {
                    Text("Add a countdown in Until")
                        .font(.system(size: Design.labelSize))
                        .foregroundColor(Design.grayLabel)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }
}

struct CountdownWidget: Widget {
    let kind: String = "UNTILCountdownWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CountdownWidgetProvider()) { entry in
            CountdownWidgetView(entry: entry)
        }
        .configurationDisplayName("Countdown")
        .description("Days left until a deadline. Add deadlines in Until → Widgets → Countdowns.")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - Hour Calculation Widget (tap to start/stop stopwatch)
private func formatHourCalculationElapsed(totalElapsedMs: Int64, startTimeMs: Int64, isRunning: Bool, now: Date) -> String {
    let nowMs = Int64(now.timeIntervalSince1970 * 1000)
    let totalMs: Int64 = totalElapsedMs + (isRunning && startTimeMs > 0 ? (nowMs - startTimeMs) : 0)
    let totalSec = max(0, totalMs / 1000)
    let h = totalSec / 3600
    let m = (totalSec % 3600) / 60
    let s = totalSec % 60
    return String(format: "%d:%02d:%02d", h, m, s)
}

struct HourCalculationWidgetEntry: TimelineEntry {
    let date: Date
    let state: HourCalculationState?
}

struct HourCalculationWidgetProvider: TimelineProvider {
    private static let entriesPerTimeline = 60

    private func loadState() -> HourCalculationState? {
        guard let json = WidgetCacheReader.loadHourCalculationJSON(),
              let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(HourCalculationState.self, from: data)
    }

    func placeholder(in context: Context) -> HourCalculationWidgetEntry {
        HourCalculationWidgetEntry(date: Date(), state: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (HourCalculationWidgetEntry) -> Void) {
        completion(HourCalculationWidgetEntry(date: Date(), state: loadState()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HourCalculationWidgetEntry>) -> Void) {
        let state = loadState()
        let calendar = Calendar.current
        let now = Date()

        if state?.isRunning == true {
            var entries: [HourCalculationWidgetEntry] = []
            for offset in 0..<Self.entriesPerTimeline {
                if let date = calendar.date(byAdding: .second, value: offset, to: now) {
                    entries.append(HourCalculationWidgetEntry(date: date, state: state))
                }
            }
            let nextRefresh = calendar.date(byAdding: .second, value: Self.entriesPerTimeline, to: now) ?? now
            completion(Timeline(entries: entries, policy: .after(nextRefresh)))
        } else {
            let entry = HourCalculationWidgetEntry(date: now, state: state)
            let nextUpdate = calendar.date(byAdding: .minute, value: 1, to: now) ?? now
            completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
        }
    }
}

struct ToggleHourCalculationIntent: AppIntent {
    static var title: LocalizedStringResource = "Start or stop hour timer"
    static var openAppWhenRun: Bool { false }

    func perform() async throws -> some IntentResult {
        guard let json = WidgetCacheReader.loadHourCalculationJSON(),
              let data = json.data(using: .utf8),
              let decoded = try? JSONDecoder().decode(HourCalculationState.self, from: data) else {
            var newState = HourCalculationState(title: "Hour timer", isRunning: true, startTimeMs: Int64(Date().timeIntervalSince1970 * 1000), totalElapsedMs: 0)
            if let encoded = try? JSONEncoder().encode(newState), let newJson = String(data: encoded, encoding: .utf8) {
                WidgetCacheReader.writeHourCalculationJSON(newJson)
            }
            WidgetCenter.shared.reloadTimelines(ofKind: "UNTILHourCalculationWidget")
            return .result()
        }

        let nowMs = Int64(Date().timeIntervalSince1970 * 1000)
        let newTotalElapsed: Int64
        let newStartTimeMs: Int64
        let newIsRunning: Bool
        if decoded.isRunning {
            newTotalElapsed = decoded.totalElapsedMs + (nowMs - decoded.startTimeMs)
            newStartTimeMs = 0
            newIsRunning = false
        } else {
            newTotalElapsed = decoded.totalElapsedMs
            newStartTimeMs = nowMs
            newIsRunning = true
        }
        let newState = HourCalculationState(title: decoded.title, isRunning: newIsRunning, startTimeMs: newStartTimeMs, totalElapsedMs: newTotalElapsed)
        if let encoded = try? JSONEncoder().encode(newState), let newJson = String(data: encoded, encoding: .utf8) {
            WidgetCacheReader.writeHourCalculationJSON(newJson)
        }
        WidgetCenter.shared.reloadTimelines(ofKind: "UNTILHourCalculationWidget")
        return .result()
    }
}

private struct HourCalculationWidgetView: View {
    let entry: HourCalculationWidgetEntry

    var body: some View {
        Group {
            if let state = entry.state {
                Button(intent: ToggleHourCalculationIntent()) {
                    VStack(spacing: 8) {
                        Text(state.title.isEmpty ? "Hour timer" : state.title)
                            .font(.system(size: Design.labelSize, weight: .semibold))
                            .foregroundColor(Design.grayLabel)
                            .lineLimit(1)
                        Text(formatHourCalculationElapsed(totalElapsedMs: state.totalElapsedMs, startTimeMs: state.startTimeMs, isRunning: state.isRunning, now: entry.date))
                            .font(.system(size: 26, weight: .bold))
                            .foregroundColor(Design.passedDot)
                        Text(state.isRunning ? "Tap to stop" : "Tap to start")
                            .font(.system(size: Design.smallLabelSize))
                            .foregroundColor(Design.remainingDot)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(16)
                }
                .buttonStyle(.plain)
            } else {
                VStack(spacing: 8) {
                    Text("Set title in Until")
                        .font(.system(size: Design.labelSize))
                        .foregroundColor(Design.grayLabel)
                    Text("0:00:00")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(Design.passedDot)
                    Text("Tap to start")
                        .font(.system(size: Design.smallLabelSize))
                        .foregroundColor(Design.remainingDot)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }
}

struct HourCalculationWidget: Widget {
    let kind: String = "UNTILHourCalculationWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HourCalculationWidgetProvider()) { entry in
            HourCalculationWidgetView(entry: entry)
        }
        .configurationDisplayName("Hour calculation")
        .description("Tap to start/stop. One timer. Set title (e.g. Office hour) in Until.")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - Widget Configurations
struct DayWidget: Widget {
    let kind: String = "UNTILDayWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DayWidgetProvider()) { entry in
            DayWidgetView(entry: entry)
        }
        .configurationDisplayName("Until Day")
        .description("See your day progress. Home screen and Lock Screen.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryInline, .accessoryCircular, .accessoryRectangular])
    }
}

struct MonthWidget: Widget {
    let kind: String = "UNTILMonthWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MonthYearWidgetProvider()) { entry in
            MonthWidgetView(entry: entry)
        }
        .configurationDisplayName("Until Month")
        .description("See your month progress. Home screen and Lock Screen.")
        .supportedFamilies([.systemMedium, .accessoryInline, .accessoryCircular, .accessoryRectangular])
    }
}

struct YearWidget: Widget {
    let kind: String = "UNTILYearWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MonthYearWidgetProvider()) { entry in
            YearWidgetView(entry: entry)
        }
        .configurationDisplayName("Until Year")
        .description("See your year progress. Home screen and Lock Screen.")
        .supportedFamilies([.systemLarge, .accessoryInline, .accessoryCircular, .accessoryRectangular])
    }
}

// MARK: - Live Activity (Dynamic Island + Lock Screen)
// UNTILLiveActivityAttributes is defined in UNTIL/UNTILLiveActivityAttributes.swift (shared target)

private let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

private func liveActivityDayLeftText(_ context: ActivityViewContext<UNTILLiveActivityAttributes>) -> String {
    guard let start = context.state.startOfDay, let end = context.state.endOfDay else {
        return "\(Int(context.state.dayHoursLeft))h left"
    }
    let nowMs = Int64(Date().timeIntervalSince1970 * 1000)
    let remainingMs = max(0, end - nowMs)
    let h = remainingMs / 3600000
    let m = (remainingMs % 3600000) / 60000
    return "\(h)h \(m)m"
}

private func liveActivityHourCalcText(_ context: ActivityViewContext<UNTILLiveActivityAttributes>) -> String {
    let totalMs = context.state.hourCalcElapsedMs
    let totalSec = max(0, totalMs / 1000)
    let h = totalSec / 3600
    let m = (totalSec % 3600) / 60
    let s = totalSec % 60
    return String(format: "%d:%02d:%02d", h, m, s)
}

private struct LiveActivityLockScreenView: View {
    let context: ActivityViewContext<UNTILLiveActivityAttributes>

    var body: some View {
        Group {
            switch context.attributes.activeWidget {
            case "day":
                liveActivityDayLockScreen
            case "month":
                liveActivityMonthLockScreen
            case "year":
                liveActivityYearLockScreen
            case "life":
                liveActivityLifeLockScreen
            case "dailyTasks":
                liveActivityDailyTasksLockScreen
            case "hourCalc":
                liveActivityHourCalcLockScreen
            default:
                liveActivityDayLockScreen
            }
        }
        .padding(16)
        .activityBackgroundTint(Design.background.opacity(0.9))
    }

    private var liveActivityDayLockScreen: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Today").font(.headline).foregroundColor(Design.lightText)
                Spacer()
                Text("\(context.state.dayPercentDone)% done").font(.subheadline).foregroundColor(Design.passed)
            }
            HStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(context.state.dayPercentDone)%").font(.title2.weight(.bold)).foregroundColor(Design.passed)
                    Text("day done").font(.caption).foregroundColor(Design.grayLabel)
                }
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(context.state.dayPercentLeft)%").font(.title2.weight(.bold)).foregroundColor(Design.left)
                    Text("left today").font(.caption).foregroundColor(Design.grayLabel)
                }
            }
            progressBar(context.state.dayProgress)
            Text("Day progress").font(.caption).foregroundColor(Design.grayLabel)
        }
    }

    private var liveActivityMonthLockScreen: some View {
        let monthIdx = Calendar.current.component(.month, from: Date()) - 1
        let monthName = monthNames[monthIdx]
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Month").font(.caption).foregroundColor(Design.grayLabel)
                    Text(monthName).font(.headline).foregroundColor(Design.lightText)
                    Text("\(context.state.monthDaysPassed)d passed").font(.caption).foregroundColor(Design.passed)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Progress").font(.caption).foregroundColor(Design.grayLabel)
                    Text("\(context.state.monthPercent)%").font(.headline).foregroundColor(Design.percent)
                    Text("\(context.state.monthDaysLeft)d left").font(.caption).foregroundColor(Design.left)
                }
            }
            progressBar(context.state.monthProgress)
            Text("\(context.state.monthDaysPassed)d passed • \(context.state.monthDaysLeft)d left")
                .font(.caption).foregroundColor(Design.grayLabel)
        }
    }

    private var liveActivityYearLockScreen: some View {
        let year = Calendar.current.component(.year, from: Date())
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Year").font(.caption).foregroundColor(Design.grayLabel)
                    Text("\(year)").font(.headline).foregroundColor(Design.lightText)
                    Text("\(context.state.yearDaysPassed)d passed").font(.caption).foregroundColor(Design.passed)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Progress").font(.caption).foregroundColor(Design.grayLabel)
                    Text("\(context.state.yearPercent)%").font(.headline).foregroundColor(Design.percent)
                    Text("\(context.state.yearDaysLeft)d left").font(.caption).foregroundColor(Design.left)
                }
            }
            progressBar(context.state.yearProgress)
            Text("Year progress").font(.caption).foregroundColor(Design.grayLabel)
        }
    }

    private var liveActivityLifeLockScreen: some View {
        let lifePct = context.state.lifePercent ?? 0
        let daysLeft = context.state.remainingDaysLife ?? 0
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Your life").font(.headline).foregroundColor(Design.lightText)
                Spacer()
                Text("\(lifePct)%").font(.headline).foregroundColor(Design.percent)
            }
            Text("\(daysLeft)d left").font(.subheadline).foregroundColor(Design.left)
            if lifePct > 0 {
                progressBar(Double(lifePct) / 100.0)
            }
        }
    }

    private var liveActivityDailyTasksLockScreen: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Today's tasks").font(.headline).foregroundColor(Design.lightText)
                Spacer()
                Text("\(context.state.dailyTasksCompleted)/\(context.state.dailyTasksTotal) done")
                    .font(.subheadline).foregroundColor(Design.left)
            }
            if context.state.dailyTasksTotal > 0 {
                progressBar(Double(context.state.dailyTasksCompleted) / Double(context.state.dailyTasksTotal))
            }
        }
    }

    private var liveActivityHourCalcLockScreen: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(context.state.hourCalcTitle.isEmpty ? "Hour timer" : context.state.hourCalcTitle)
                    .font(.headline).foregroundColor(Design.lightText)
                Spacer()
                Text(liveActivityHourCalcText(context)).font(.title2.weight(.bold)).foregroundColor(Design.passedDot)
            }
            Text(context.state.hourCalcIsRunning ? "Running" : "Tap to start").font(.caption).foregroundColor(Design.grayLabel)
        }
    }

    private func progressBar(_ progress: Double) -> some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4).fill(Design.progressBg)
                RoundedRectangle(cornerRadius: 4)
                    .fill(Design.progressOrange)
                    .frame(width: max(0, geo.size.width * CGFloat(min(progress, 1))))
            }
        }
        .frame(height: 8)
    }
}

private struct LiveActivityCompactLeadingView: View {
    let context: ActivityViewContext<UNTILLiveActivityAttributes>

    var body: some View {
        Group {
            switch context.attributes.activeWidget {
            case "day":
                Text("\(context.state.dayPercentDone)%").font(.system(size: 14, weight: .semibold)).foregroundColor(Design.passed)
            case "month":
                Text("\(context.state.monthPercent)%").font(.system(size: 14, weight: .semibold)).foregroundColor(Design.percent)
            case "year":
                Text("\(context.state.yearPercent)%").font(.system(size: 14, weight: .semibold)).foregroundColor(Design.progressOrange)
            case "life":
                Text("\(context.state.lifePercent ?? 0)%").font(.system(size: 14, weight: .semibold)).foregroundColor(Design.percent)
            case "dailyTasks":
                Text("\(context.state.dailyTasksCompleted)/\(context.state.dailyTasksTotal)").font(.system(size: 14, weight: .semibold)).foregroundColor(Design.left)
            case "hourCalc":
                Text(liveActivityHourCalcText(context)).font(.system(size: 13, weight: .semibold)).foregroundColor(Design.passedDot)
            default:
                Text("\(context.state.dayPercentDone)%").font(.system(size: 14, weight: .semibold)).foregroundColor(Design.passed)
            }
        }
    }
}

private struct LiveActivityCompactTrailingView: View {
    let context: ActivityViewContext<UNTILLiveActivityAttributes>

    var body: some View {
        Group {
            switch context.attributes.activeWidget {
            case "day":
                Text("\(context.state.dayPercentLeft)% left").font(.system(size: 13, weight: .medium)).foregroundColor(Design.left)
            case "month":
                Text("\(context.state.monthDaysLeft)d left").font(.system(size: 13, weight: .medium)).foregroundColor(Design.left)
            case "year":
                Text("\(context.state.yearDaysLeft)d left").font(.system(size: 13, weight: .medium)).foregroundColor(Design.left)
            case "life":
                Text("\(context.state.remainingDaysLife ?? 0)d left").font(.system(size: 13, weight: .medium)).foregroundColor(Design.left)
            case "dailyTasks":
                Text("done").font(.system(size: 13, weight: .medium)).foregroundColor(Design.grayLabel)
            case "hourCalc":
                Text(context.state.hourCalcIsRunning ? "Running" : "Stopped").font(.system(size: 12, weight: .medium)).foregroundColor(Design.grayLabel)
            default:
                Text(liveActivityDayLeftText(context)).font(.system(size: 13, weight: .medium)).foregroundColor(Design.left)
            }
        }
    }
}

private struct LiveActivityExpandedContentView: View {
    let context: ActivityViewContext<UNTILLiveActivityAttributes>

    var body: some View {
        VStack(spacing: 3) {
            switch context.attributes.activeWidget {
            case "day":
                expandedDayContent
            case "month":
                expandedMonthContent
            case "year":
                expandedYearContent
            case "life":
                expandedLifeContent
            case "dailyTasks":
                expandedDailyTasksContent
            case "hourCalc":
                expandedHourCalcContent
            default:
                expandedDayContent
            }
            expandedGlanceRow
            Text("Tap to open Until").font(.system(size: 8)).foregroundColor(Design.grayLabel.opacity(0.8))
        }
    }

    private var expandedDayContent: some View {
        VStack(spacing: 3) {
            HStack(spacing: 4) {
                Text("\(context.state.dayPercentDone)% done").font(.system(size: 12, weight: .bold)).foregroundColor(Design.passed)
                    .lineLimit(1).minimumScaleFactor(0.7)
                Spacer(minLength: 4)
                Text(liveActivityDayLeftText(context) + " left").font(.system(size: 12, weight: .bold)).foregroundColor(Design.left)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            expandedProgressBar(context.state.dayProgress)
        }
    }

    private var expandedMonthContent: some View {
        let monthIdx = Calendar.current.component(.month, from: Date()) - 1
        let monthName = monthNames[monthIdx]
        return VStack(spacing: 3) {
            HStack(spacing: 4) {
                Text("\(monthName) \(context.state.monthDaysPassed)d").font(.system(size: 12, weight: .semibold)).foregroundColor(Design.passed)
                    .lineLimit(1).minimumScaleFactor(0.7)
                Spacer(minLength: 4)
                Text("\(context.state.monthPercent)% \(context.state.monthDaysLeft)d left").font(.system(size: 12, weight: .semibold)).foregroundColor(Design.left)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            expandedProgressBar(context.state.monthProgress)
        }
    }

    private var expandedYearContent: some View {
        let year = Calendar.current.component(.year, from: Date())
        return VStack(spacing: 3) {
            HStack(spacing: 4) {
                Text("\(year) \(context.state.yearDaysPassed)d").font(.system(size: 12, weight: .semibold)).foregroundColor(Design.passed)
                    .lineLimit(1).minimumScaleFactor(0.7)
                Spacer(minLength: 4)
                Text("\(context.state.yearPercent)% \(context.state.yearDaysLeft)d left").font(.system(size: 12, weight: .semibold)).foregroundColor(Design.left)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            expandedProgressBar(context.state.yearProgress)
        }
    }

    private var expandedLifeContent: some View {
        let lifePct = context.state.lifePercent ?? 0
        let daysLeft = context.state.remainingDaysLife ?? 0
        return VStack(spacing: 3) {
            HStack(spacing: 4) {
                Text("\(lifePct)% lived").font(.system(size: 12, weight: .bold)).foregroundColor(Design.percent)
                    .lineLimit(1).minimumScaleFactor(0.7)
                Spacer(minLength: 4)
                Text("\(daysLeft)d left").font(.system(size: 12, weight: .bold)).foregroundColor(Design.left)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            if lifePct > 0 {
                expandedProgressBar(Double(lifePct) / 100.0)
            }
        }
    }

    private var expandedDailyTasksContent: some View {
        let total = context.state.dailyTasksTotal
        let done = context.state.dailyTasksCompleted
        let progress = total > 0 ? Double(done) / Double(total) : 0.0
        return VStack(spacing: 3) {
            HStack(spacing: 4) {
                Text("\(done)/\(total) done").font(.system(size: 12, weight: .bold)).foregroundColor(Design.left)
                    .lineLimit(1).minimumScaleFactor(0.7)
                Spacer(minLength: 4)
                if total > 0 {
                    Text("\(Int(progress * 100))%").font(.system(size: 12, weight: .bold)).foregroundColor(Design.percent)
                        .lineLimit(1).minimumScaleFactor(0.7)
                }
            }
            if total > 0 {
                expandedProgressBar(progress)
            }
        }
    }

    private var expandedHourCalcContent: some View {
        HStack(spacing: 4) {
            Text(liveActivityHourCalcText(context)).font(.system(size: 14, weight: .bold)).foregroundColor(Design.passedDot)
                .lineLimit(1).minimumScaleFactor(0.7)
            Spacer(minLength: 4)
            Text(context.state.hourCalcIsRunning ? "Running" : "Stopped")
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(context.state.hourCalcIsRunning ? Design.left : Design.grayLabel)
        }
    }

    private var expandedGlanceRow: some View {
        HStack(spacing: 8) {
            Text("D\(context.state.dayPercentDone)%").font(.system(size: 9)).foregroundColor(Design.passed)
            Text("M\(context.state.monthPercent)%").font(.system(size: 9)).foregroundColor(Design.percent)
            Text("Y\(context.state.yearPercent)%").font(.system(size: 9)).foregroundColor(Design.progressOrange)
            if let life = context.state.lifePercent, life > 0 {
                Text("L\(life)%").font(.system(size: 9)).foregroundColor(Design.left)
            }
            if context.state.dailyTasksTotal > 0 {
                Text("T\(context.state.dailyTasksCompleted)/\(context.state.dailyTasksTotal)").font(.system(size: 9)).foregroundColor(Design.left)
            }
        }
    }

    private func expandedProgressBar(_ progress: Double) -> some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 3).fill(Design.progressBg)
                RoundedRectangle(cornerRadius: 3)
                    .fill(Design.progressOrange)
                    .frame(width: max(0, geo.size.width * CGFloat(min(progress, 1))))
            }
        }
        .frame(height: 5)
    }
}

struct UNTILLiveActivityWidget: Widget {
    private static let appURL = URL(string: "until://")!

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: UNTILLiveActivityAttributes.self) { context in
            LiveActivityLockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading, priority: 0.5) {
                    Link(destination: Self.appURL) {
                        LiveActivityCompactLeadingView(context: context)
                    }
                    .buttonStyle(.plain)
                }
                DynamicIslandExpandedRegion(.trailing, priority: 0.5) {
                    Link(destination: Self.appURL) {
                        LiveActivityCompactTrailingView(context: context)
                    }
                    .buttonStyle(.plain)
                }
                DynamicIslandExpandedRegion(.center, priority: 1) {
                    Link(destination: Self.appURL) {
                        LiveActivityExpandedContentView(context: context)
                    }
                    .buttonStyle(.plain)
                }
            } compactLeading: {
                LiveActivityCompactLeadingView(context: context)
            } compactTrailing: {
                LiveActivityCompactTrailingView(context: context)
            } minimal: {
                Image(systemName: "clock.fill")
                    .foregroundColor(Design.passedDot)
            }
        }
    }
}

// MARK: - Widget Bundle
@main
struct UNTILWidgetsBundle: WidgetBundle {
    var body: some Widget {
        DayWidget()
        MonthWidget()
        YearWidget()
        CounterWidget()
        CountdownWidget()
        DailyTasksWidget()
        HourCalculationWidget()
        UNTILLiveActivityWidget()
    }
}
