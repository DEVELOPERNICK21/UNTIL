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
    /// Start of current day (Unix ms). Used with current time for h/m readout.
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
    /// ISO birth date for watch Life sync.
    let birthDate: String?
    /// Expected lifespan years for watch Life sync.
    let deathAge: Int?
    /// Hex accent for percent/current markers (e.g. #E87C20). Optional.
    let accentColor: String?
    let presenceStreakCount: Int
    /// Last 7 days noticed flags, oldest to newest.
    let presenceStreakDots: [Bool]
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
        birthDate = try c.decodeIfPresent(String.self, forKey: .birthDate)
        deathAge = try c.decodeIfPresent(Int.self, forKey: .deathAge)
        accentColor = try c.decodeIfPresent(String.self, forKey: .accentColor)
        presenceStreakCount = max(0, try c.decodeIfPresent(Int.self, forKey: .presenceStreakCount) ?? 0)
        let decodedDots = try c.decodeIfPresent([Bool].self, forKey: .presenceStreakDots) ?? []
        presenceStreakDots = Array(
            (decodedDots + Array(repeating: false, count: 7)).prefix(7)
        )
        updatedAt = try c.decode(Int64.self, forKey: .updatedAt)
    }

    init(
        dayProgress: Double,
        dayPercentDone: Int,
        dayPercentLeft: Int,
        dayHoursPassed: Double,
        dayHoursLeft: Double,
        dayPassedMinutes: Int?,
        dayRemainingMinutes: Int?,
        startOfDay: Int64?,
        endOfDay: Int64?,
        monthProgress: Double,
        monthIndex: Int?,
        monthDaysPassed: Int,
        monthDaysLeft: Int,
        monthPercent: Int,
        yearProgress: Double,
        yearDaysPassed: Int,
        yearDaysLeft: Int,
        yearPercent: Int,
        lifeProgress: Double?,
        remainingDaysLife: Int?,
        lifePercent: Int?,
        birthDate: String? = nil,
        deathAge: Int? = nil,
        accentColor: String? = nil,
        presenceStreakCount: Int = 0,
        presenceStreakDots: [Bool] = Array(repeating: false, count: 7),
        updatedAt: Int64
    ) {
        self.dayProgress = dayProgress
        self.dayPercentDone = dayPercentDone
        self.dayPercentLeft = dayPercentLeft
        self.dayHoursPassed = dayHoursPassed
        self.dayHoursLeft = dayHoursLeft
        self.dayPassedMinutes = dayPassedMinutes
        self.dayRemainingMinutes = dayRemainingMinutes
        self.startOfDay = startOfDay
        self.endOfDay = endOfDay
        self.monthProgress = monthProgress
        self.monthIndex = monthIndex
        self.monthDaysPassed = monthDaysPassed
        self.monthDaysLeft = monthDaysLeft
        self.monthPercent = monthPercent
        self.yearProgress = yearProgress
        self.yearDaysPassed = yearDaysPassed
        self.yearDaysLeft = yearDaysLeft
        self.yearPercent = yearPercent
        self.lifeProgress = lifeProgress
        self.remainingDaysLife = remainingDaysLife
        self.lifePercent = lifePercent
        self.birthDate = birthDate
        self.deathAge = deathAge
        self.accentColor = accentColor
        self.presenceStreakCount = presenceStreakCount
        self.presenceStreakDots = Array(
            (presenceStreakDots + Array(repeating: false, count: 7)).prefix(7)
        )
        self.updatedAt = updatedAt
    }

    /// Recompute day from wall clock; refresh month/year when app has not synced today.
    func freshForDisplay(at now: Date = Date()) -> WidgetCache {
        let cal = Calendar.current
        let startOfToday = cal.startOfDay(for: now)
        var endComps = cal.dateComponents([.year, .month, .day], from: now)
        endComps.hour = 23
        endComps.minute = 59
        endComps.second = 59
        endComps.nanosecond = 999_000_000
        let endOfToday = cal.date(from: endComps) ?? now
        let startMs = Int64(startOfToday.timeIntervalSince1970 * 1000)
        let endMs = Int64(endOfToday.timeIntervalSince1970 * 1000)
        let nowMs = now.timeIntervalSince1970 * 1000
        let totalMs = max(1.0, Double(endMs - startMs))
        let elapsedMs = min(max(0, nowMs - Double(startMs)), totalMs)
        let remainingMs = max(0, Double(endMs) - nowMs)
        let progress = min(1, max(0, elapsedMs / totalMs))
        let totalMinutesInDay = 24 * 60
        let passedMinutes = Int(progress * Double(totalMinutesInDay))
        let remainingMinutes = max(0, totalMinutesInDay - passedMinutes)
        let dayHoursPassed = (progress * 24 * 10).rounded() / 10
        let dayHoursLeft = (remainingMs / (60 * 60 * 1000) * 10).rounded() / 10

        var monthProgress = self.monthProgress
        var monthIndex = self.monthIndex
        var monthDaysPassed = self.monthDaysPassed
        var monthDaysLeft = self.monthDaysLeft
        var monthPercent = self.monthPercent
        var yearProgress = self.yearProgress
        var yearDaysPassed = self.yearDaysPassed
        var yearDaysLeft = self.yearDaysLeft
        var yearPercent = self.yearPercent

        if updatedAt < startMs {
            let dayOfMonth = cal.component(.day, from: now)
            let daysInMonth = cal.range(of: .day, in: .month, for: now)?.count ?? 31
            let monthLeft = daysInMonth - dayOfMonth
            monthProgress = daysInMonth > 0 ? Double(dayOfMonth) / Double(daysInMonth) : 0
            monthIndex = cal.component(.month, from: now)
            monthDaysPassed = dayOfMonth
            monthDaysLeft = monthLeft
            monthPercent = Int((monthProgress * 100).rounded()).clamped(to: 0...100)
            let dayOfYear = cal.ordinality(of: .day, in: .year, for: now) ?? 1
            let daysInYear = cal.range(of: .day, in: .year, for: now)?.count ?? 365
            let yearLeft = daysInYear - dayOfYear
            yearProgress = daysInYear > 0 ? Double(dayOfYear) / Double(daysInYear) : 0
            yearDaysPassed = dayOfYear
            yearDaysLeft = yearLeft
            yearPercent = Int((yearProgress * 100).rounded()).clamped(to: 0...100)
        }

        return WidgetCache(
            dayProgress: progress,
            dayPercentDone: Int((progress * 100).rounded()).clamped(to: 0...100),
            dayPercentLeft: Int(((1 - progress) * 100).rounded()).clamped(to: 0...100),
            dayHoursPassed: dayHoursPassed,
            dayHoursLeft: dayHoursLeft,
            dayPassedMinutes: passedMinutes,
            dayRemainingMinutes: remainingMinutes,
            startOfDay: startMs,
            endOfDay: endMs,
            monthProgress: monthProgress,
            monthIndex: monthIndex,
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
            birthDate: birthDate,
            deathAge: deathAge,
            accentColor: accentColor,
            presenceStreakCount: presenceStreakCount,
            presenceStreakDots: presenceStreakDots,
            updatedAt: updatedAt
        )
    }
}

// MARK: - Design Tokens
private enum Design {
    private static let defaultAccent = Color(red: 0xE8/255, green: 0x7C/255, blue: 0x20/255) // #E87C20 Ember
    private static var resolvedAccent: Color = defaultAccent

    static let background = Color(red: 0x0E/255, green: 0x0E/255, blue: 0x10/255)
    /// Passed / consumed — muted, not alarm red
    static let passed = Color(red: 0x8E/255, green: 0x8E/255, blue: 0x93/255)
    /// Remaining — bright readable white
    static let left = Color(red: 0xED/255, green: 0xED/255, blue: 0xED/255)
    static var percent: Color { resolvedAccent }
    static var progressOrange: Color { resolvedAccent }
    static let passedDot = Color(red: 0xBB/255, green: 0x86/255, blue: 0xFC/255)   // #BB86FC purple
    static var currentDot: Color { resolvedAccent }
    static let remainingDot = Color(red: 0x4A/255, green: 0x4A/255, blue: 0x4E/255)
    static let grayLabel = Color(red: 0x8A/255, green: 0x8A/255, blue: 0x8E/255)
    static let lightText = Color(red: 0xF2/255, green: 0xF2/255, blue: 0xF2/255)
    static let progressBg = Color(red: 0x3A/255, green: 0x34/255, blue: 0x2F/255)
    static let border = Color.white.opacity(0.20)
    static let labelSize: CGFloat = 12
    static let valueSize: CGFloat = 16
    static let bigPercentSize: CGFloat = 30
    static let smallLabelSize: CGFloat = 11
    static let contentPadding: CGFloat = 14
    static let stackSpacing: CGFloat = 8
    static let barHeight: CGFloat = 4

    static func applyAccent(from cache: WidgetCache?) {
        if let hex = cache?.accentColor, let color = Color(untilHex: hex) {
            resolvedAccent = color
        } else {
            resolvedAccent = defaultAccent
        }
    }
}

private extension Color {
    init?(untilHex hex: String) {
        var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleaned.hasPrefix("#") { cleaned.removeFirst() }
        guard cleaned.count == 6, let value = UInt32(cleaned, radix: 16) else { return nil }
        let r = Double((value >> 16) & 0xFF) / 255
        let g = Double((value >> 8) & 0xFF) / 255
        let b = Double(value & 0xFF) / 255
        self = Color(red: r, green: g, blue: b)
    }
}

// MARK: - Ember glyph (static mood companion for widgets; mirrors src/ui/Ember.tsx bands)
private enum EmberMood {
    case dawn, open, mid, late, dusk

    static func from(progress: Double) -> EmberMood {
        let p = min(1, max(0, progress))
        if p < 0.15 { return .dawn }
        if p < 0.4 { return .open }
        if p < 0.65 { return .mid }
        if p < 0.85 { return .late }
        return .dusk
    }

    var hi: Color {
        switch self {
        case .dawn: return Color(red: 0xFD/255, green: 0xE6/255, blue: 0x8A/255)
        case .open: return Color(red: 0xFD/255, green: 0xA4/255, blue: 0xAF/255)
        case .mid: return Color(red: 0xFD/255, green: 0xBA/255, blue: 0x74/255)
        case .late: return Color(red: 0xC4/255, green: 0xB5/255, blue: 0xFD/255)
        case .dusk: return Color(red: 0xA5/255, green: 0xB4/255, blue: 0xFC/255)
        }
    }

    var mid: Color {
        switch self {
        case .dawn: return Color(red: 0xF5/255, green: 0x9E/255, blue: 0x0B/255)
        case .open: return Color(red: 0xFB/255, green: 0x71/255, blue: 0x85/255)
        case .mid: return Design.currentDot
        case .late: return Color(red: 0x8B/255, green: 0x5C/255, blue: 0xF6/255)
        case .dusk: return Color(red: 0x63/255, green: 0x66/255, blue: 0xF1/255)
        }
    }

    var deep: Color {
        switch self {
        case .dawn: return Color(red: 0xB4/255, green: 0x53/255, blue: 0x09/255)
        case .open: return Color(red: 0xE1/255, green: 0x1D/255, blue: 0x48/255)
        case .mid: return Color(red: 0xC2/255, green: 0x41/255, blue: 0x0C/255)
        case .late: return Color(red: 0x5B/255, green: 0x21/255, blue: 0xB6/255)
        case .dusk: return Color(red: 0x31/255, green: 0x2E/255, blue: 0x81/255)
        }
    }
}

private struct EmberGlyph: View {
    var progress: Double = 0.35
    var size: CGFloat = 40

    private var mood: EmberMood { EmberMood.from(progress: progress) }

    var body: some View {
        ZStack {
            Circle()
                .fill(mood.mid.opacity(0.35))
                .frame(width: size * 1.15, height: size * 1.15)

            Circle()
                .fill(
                    RadialGradient(
                        colors: [.white.opacity(0.95), mood.hi, mood.mid, mood.deep],
                        center: UnitPoint(x: 0.35, y: 0.28),
                        startRadius: 0,
                        endRadius: size * 0.55
                    )
                )
                .frame(width: size, height: size)

            HStack(spacing: size * 0.22) {
                Circle().fill(Color(red: 1, green: 0.97, blue: 0.9)).frame(width: size * 0.14, height: size * 0.16)
                Circle().fill(Color(red: 1, green: 0.97, blue: 0.9)).frame(width: size * 0.14, height: size * 0.16)
            }
            .offset(y: -size * 0.06)

            Capsule()
                .stroke(Color.white.opacity(0.85), lineWidth: max(1.5, size * 0.05))
                .frame(width: size * 0.42, height: size * 0.18)
                .offset(y: size * 0.18)
        }
        .frame(width: size * 1.2, height: size * 1.2)
        .accessibilityLabel("Ember companion")
    }
}

private struct EmberEmptyStateView: View {
    var progress: Double = 0.35
    var message: String

    var body: some View {
        VStack(spacing: 10) {
            EmberGlyph(progress: progress, size: 44)
            Text(message)
                .font(.system(size: Design.labelSize))
                .foregroundColor(Design.grayLabel)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 12)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct PremiumLockedWidgetView: View {
    var message: String

    var body: some View {
        VStack(spacing: 10) {
            EmberGlyph(progress: 0.28, size: 40)
            Text(message)
                .font(.system(size: Design.labelSize, weight: .semibold))
                .foregroundColor(Design.grayLabel)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 12)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Widget Provider
/// Shared provider for widgets that don't need per-second or per-minute updates.
/// Used when a dedicated provider (Day, MonthYear, etc.) is more appropriate.
struct UNTILWidgetProvider: TimelineProvider {
    private func loadWidgetCache(at now: Date = Date()) -> WidgetCache? {
        guard let json = WidgetCacheReader.loadJSON() else { return nil }
        guard let data = json.data(using: .utf8) else { return nil }
        guard let cache = try? JSONDecoder().decode(WidgetCache.self, from: data) else { return nil }
        let fresh = cache.freshForDisplay(at: now)
        Design.applyAccent(from: fresh)
        return fresh
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
    private func loadWidgetCache(at now: Date = Date()) -> WidgetCache? {
        guard let json = WidgetCacheReader.loadJSON() else { return nil }
        guard let data = json.data(using: .utf8) else { return nil }
        guard let cache = try? JSONDecoder().decode(WidgetCache.self, from: data) else { return nil }
        let fresh = cache.freshForDisplay(at: now)
        Design.applyAccent(from: fresh)
        return fresh
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

/// Day widget: minute-level timeline (h/m readout; no per-second refresh).
struct DayWidgetProvider: TimelineProvider {
    private static let entriesPerTimeline = 30

    private func loadWidgetCache(at now: Date = Date()) -> WidgetCache? {
        guard let json = WidgetCacheReader.loadJSON() else { return nil }
        guard let data = json.data(using: .utf8) else { return nil }
        guard let cache = try? JSONDecoder().decode(WidgetCache.self, from: data) else { return nil }
        let fresh = cache.freshForDisplay(at: now)
        Design.applyAccent(from: fresh)
        return fresh
    }

    func placeholder(in context: Context) -> UNTILWidgetEntry {
        UNTILWidgetEntry(date: Date(), cache: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (UNTILWidgetEntry) -> Void) {
        let cache = loadWidgetCache()
        completion(UNTILWidgetEntry(date: Date(), cache: cache))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<UNTILWidgetEntry>) -> Void) {
        let calendar = Calendar.current
        let now = Date()
        var entries: [UNTILWidgetEntry] = []
        for offset in 0..<Self.entriesPerTimeline {
            guard let date = calendar.date(byAdding: .minute, value: offset, to: now) else { continue }
            let cache = loadWidgetCache(at: date)
            entries.append(UNTILWidgetEntry(date: date, cache: cache))
        }
        let nextRefresh = calendar.date(byAdding: .minute, value: Self.entriesPerTimeline, to: now) ?? now
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

    private func loadWidgetCache(at now: Date = Date()) -> WidgetCache? {
        guard let json = WidgetCacheReader.loadJSON() else { return nil }
        guard let data = json.data(using: .utf8) else { return nil }
        guard let cache = try? JSONDecoder().decode(WidgetCache.self, from: data) else { return nil }
        let fresh = cache.freshForDisplay(at: now)
        Design.applyAccent(from: fresh)
        return fresh
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
            HStack(alignment: .center, spacing: 8) {
                Text("TODAY'S TASKS")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(Design.grayLabel)
                    .tracking(1.2)
                Spacer(minLength: 0)
                EmberGlyph(progress: entry.dayCache?.dayProgress ?? 0.35, size: 26)
            }
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
        EmberEmptyStateView(
            progress: entry.dayCache?.dayProgress ?? 0.35,
            message: "Nothing listed yet — a quiet day is still a day."
        )
        .padding(12)
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

                EmberGlyph(progress: progress, size: max(28, ringRadius * 0.78))
                    .position(x: center, y: center)
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
    private let dotRadius: CGFloat = 8.5
    private let currentDotRadius: CGFloat = 12
    private let gap: CGFloat = 10

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

private func lifeYearMetrics(from cache: WidgetCache) -> (livedYears: Double, leftYears: Double, totalYears: Int, lifePct: Int)? {
    guard let rawProgress = cache.lifeProgress,
          let remainingDaysLife = cache.remainingDaysLife,
          let lifePct = cache.lifePercent else {
        return nil
    }
    let progress = rawProgress.clamped(to: 0.0...1.0)
    let leftYearsRaw = max(0, Double(remainingDaysLife) / 365.25)
    let totalYearsRaw: Double
    if progress >= 0.999999 {
        totalYearsRaw = max(1.0, leftYearsRaw)
    } else {
        totalYearsRaw = max(1.0, leftYearsRaw / (1.0 - progress))
    }
    let totalYears = min(120, max(1, Int(totalYearsRaw.rounded())))
    let livedYears = (Double(totalYears) * progress).clamped(to: 0.0...Double(totalYears))
    let leftYears = max(0.0, Double(totalYears) - livedYears)
    return (livedYears, leftYears, totalYears, lifePct.clamped(to: 0...100))
}

private func formatYears(_ years: Double) -> String {
    String(format: "%.1f", years)
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

// MARK: - Life Dots View (1 dot per life year, capped to 120)
private struct LifeYearsDotsView: View {
    let progress: Double
    let totalYears: Int
    var availableWidth: CGFloat = 0
    var availableHeight: CGFloat = 0
    private let horizontalInset: CGFloat = 8
    private let cols = 12
    private var rows: Int { (dots + cols - 1) / cols }
    private var dots: Int { totalYears.clamped(to: 1...120) }
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
        let clampedProgress = progress.clamped(to: 0.0...1.0)
        let passedDots = min(Int(Double(dots) * clampedProgress), dots)
        let hasCurrent = clampedProgress < 1.0 && passedDots < dots
        let currentDot = hasCurrent ? passedDots : -1
        let size = cellSize
        let scale = scaleToFit

        LazyVGrid(columns: Array(repeating: GridItem(.fixed(size), spacing: gap), count: cols), spacing: gap) {
            ForEach(0..<dots, id: \.self) { i in
                let radius = (i == currentDot && currentDot >= 0) ? min(currentDotRadius, size / 2) : min(dotRadius, size / 2)
                let color: Color = {
                    if i < passedDots { return Design.passedDot }
                    if i == currentDot && currentDot >= 0 { return Design.currentDot }
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

            EmberGlyph(progress: progress, size: max(36, size * 0.32))
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
        return "\(h)h \(m)m passed"
    }
    if let pm = cache.dayPassedMinutes {
        let h = pm / 60, m = pm % 60
        return "\(h)h \(m)m passed"
    }
    return "\(Int(cache.dayHoursPassed))h 0m passed"
}

private func dayTimeLeftText(_ cache: WidgetCache, now: Date = Date()) -> String {
    if let start = cache.startOfDay, let end = cache.endOfDay {
        let endSec = Double(end) / 1000
        let nowSec = now.timeIntervalSince1970
        let remainingSec = max(0, Int(endSec - nowSec))
        let h = remainingSec / 3600
        let m = (remainingSec % 3600) / 60
        return "\(h)h \(m)m left"
    }
    if let rm = cache.dayRemainingMinutes {
        let h = rm / 60, m = rm % 60
        return "\(h)h \(m)m left"
    }
    return "\(Int(cache.dayHoursLeft))h 0m left"
}

// MARK: - Day Metrics View (right side metrics for large layout)
private struct DayMetricsView: View {
    let cache: WidgetCache
    /// Use entry date for live h/m; nil falls back to cache-only.
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

private struct LifeAccessoryInlineView: View {
    let cache: WidgetCache

    var body: some View {
        if let metrics = lifeYearMetrics(from: cache) {
            Text("Life \(metrics.lifePct)% · \(formatYears(metrics.leftYears))y left")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(Design.lightText)
        } else {
            Text("Set birth date in Until")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(Design.grayLabel)
        }
    }
}

private struct LifeAccessoryCircularView: View {
    let cache: WidgetCache

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 2) {
                Text("\(cache.lifePercent ?? 0)%")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(Design.percent)
                Text("life")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Design.grayLabel)
            }
        }
    }
}

private struct LifeAccessoryRectangularView: View {
    let cache: WidgetCache

    var body: some View {
        if let metrics = lifeYearMetrics(from: cache) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Your life")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Design.grayLabel)
                HStack {
                    Text("\(formatYears(metrics.livedYears))y lived")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Design.passed)
                    Spacer()
                    Text("\(formatYears(metrics.leftYears))y left")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Design.left)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Design.progressBg)
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Design.progressOrange)
                            .frame(width: max(0, geo.size.width * CGFloat(metrics.livedYears / Double(metrics.totalYears))))
                    }
                }
                .frame(height: 6)
            }
        } else {
            VStack(alignment: .leading, spacing: 6) {
                Text("Your life")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Design.grayLabel)
                Text("Set birth date in Until")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(Design.lightText)
            }
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
                    // Hero: ring + Ember; support: leftover %
                    VStack(spacing: Design.stackSpacing) {
                        DayDotsView(progress: cache.dayProgress)
                            .frame(maxWidth: .infinity)
                            .layoutPriority(1)

                        Text("\(cache.dayPercentLeft)% left")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Design.percent)
                    }
                    .padding(Design.contentPadding)

                default: // .systemMedium
                    // Hero: ring + Ember; one support row
                    VStack(spacing: Design.stackSpacing) {
                        DayDotsView(progress: cache.dayProgress)
                            .frame(maxWidth: .infinity)
                            .layoutPriority(1)

                        Text("\(cache.dayPercentLeft)% left · \(dayTimeLeftText(cache, now: entry.date))")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(Design.lightText)
                            .multilineTextAlignment(.center)
                            .lineLimit(1)
                            .minimumScaleFactor(0.85)
                    }
                    .padding(Design.contentPadding)
                }
            } else {
                EmberEmptyStateView(
                    progress: 0.32,
                    message: "Open UNTIL — Ember is waiting with today’s light."
                )
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }

    private var placeholderView: some View {
        EmberEmptyStateView(
            progress: 0.32,
            message: "Open UNTIL — Ember is waiting with today’s light."
        )
    }
}

// MARK: - Month Widget View
struct MonthWidgetView: View {
    let entry: UNTILWidgetEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if !WidgetCacheReader.isPremium {
                PremiumLockedWidgetView(
                    message: "Month widget is Premium.\nOpen Until to upgrade."
                )
            } else if let cache = entry.cache {
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
        VStack(alignment: .leading, spacing: 0) {
            Text("MONTH")
                .font(.system(size: 10, weight: .bold))
                .tracking(1.2)
                .foregroundColor(Design.grayLabel)

            MonthDotsView(progress: cache.monthProgress, monthIndex: cache.monthIndex)
                .frame(maxWidth: .infinity)
                .padding(.top, 10)
                .padding(.bottom, 12)
                .layoutPriority(1)

            VStack(spacing: 2) {
                Text("\(cache.monthPercent)%")
                    .font(.system(size: 30, weight: .bold))
                    .foregroundColor(Design.percent)
                    .minimumScaleFactor(0.8)
                Text("of month")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Design.grayLabel)
            }
            .frame(maxWidth: .infinity)

            HStack(spacing: 6) {
                Text("\(cache.monthDaysPassed)d passed")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Design.passed)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Spacer(minLength: 4)
                Text("\(cache.monthDaysLeft)d left")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(Design.left)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .padding(.top, 10)

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Design.progressBg)
                    Capsule()
                        .fill(Design.percent)
                        .frame(width: max(0, geo.size.width * cache.monthProgress))
                }
            }
            .frame(height: 4)
            .padding(.top, 6)
        }
        .padding(14)
    }

    private var placeholderView: some View {
        EmberEmptyStateView(
            progress: 0.32,
            message: "Open UNTIL — Ember is waiting with today’s light."
        )
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

        return VStack(alignment: .leading, spacing: 0) {
            Text("YEAR")
                .font(.system(size: 10, weight: .bold))
                .tracking(1.2)
                .foregroundColor(Design.grayLabel)

            GeometryReader { geo in
                YearDotsView(
                    progress: cache.yearProgress,
                    yearDaysPassed: cache.yearDaysPassed,
                    availableWidth: geo.size.width,
                    availableHeight: geo.size.height
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .frame(maxWidth: .infinity)
            .frame(minHeight: 96)
            .padding(.top, 10)
            .padding(.bottom, 12)
            .layoutPriority(1)

            VStack(spacing: 2) {
                Text("\(consumedPct)%")
                    .font(.system(size: 30, weight: .bold))
                    .foregroundColor(Design.percent)
                    .minimumScaleFactor(0.8)
                Text("of year")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Design.grayLabel)
            }
            .frame(maxWidth: .infinity)

            HStack(spacing: 6) {
                Text("\(cache.yearDaysPassed)d passed")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Design.passed)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Spacer(minLength: 4)
                Text("\(cache.yearDaysLeft)d left")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(Design.left)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .padding(.top, 10)

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Design.progressBg)
                    Capsule()
                        .fill(Design.percent)
                        .frame(width: max(0, geo.size.width * cache.yearProgress))
                }
            }
            .frame(height: 4)
            .padding(.top, 6)
        }
        .padding(14)
    }

    private var placeholderView: some View {
        EmberEmptyStateView(
            progress: 0.32,
            message: "Open UNTIL — Ember is waiting with today’s light."
        )
    }
}

// MARK: - Life Widget View
struct LifeWidgetView: View {
    let entry: UNTILWidgetEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if !WidgetCacheReader.isPremium {
                PremiumLockedWidgetView(
                    message: "Life widget is Premium.\nOpen Until to upgrade."
                )
            } else if let cache = entry.cache {
                switch family {
                case .accessoryInline:
                    LifeAccessoryInlineView(cache: cache)
                case .accessoryCircular:
                    LifeAccessoryCircularView(cache: cache)
                case .accessoryRectangular:
                    LifeAccessoryRectangularView(cache: cache)
                default:
                    lifeContent(cache: cache)
                }
            } else {
                placeholderView
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }

    private func lifeContent(cache: WidgetCache) -> some View {
        if let metrics = lifeYearMetrics(from: cache) {
            return AnyView(
                VStack(spacing: Design.stackSpacing) {
                    GeometryReader { geo in
                        LifeYearsDotsView(
                            progress: metrics.livedYears / Double(metrics.totalYears),
                            totalYears: metrics.totalYears,
                            availableWidth: geo.size.width,
                            availableHeight: geo.size.height
                        )
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: 72, maxHeight: 100)
                    .layoutPriority(1)

                    HStack(spacing: 6) {
                        Text("\(formatYears(metrics.livedYears))y lived")
                            .font(.system(size: Design.labelSize, weight: .semibold))
                            .foregroundColor(Design.passed)
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                        Spacer(minLength: 4)
                        Text("\(formatYears(metrics.leftYears))y left")
                            .font(.system(size: Design.labelSize, weight: .semibold))
                            .foregroundColor(Design.left)
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }

                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(Design.progressBg)
                            Capsule()
                                .fill(Design.percent)
                                .frame(width: max(0, geo.size.width * CGFloat(metrics.livedYears / Double(metrics.totalYears))))
                        }
                    }
                    .frame(height: Design.barHeight)

                    VStack(spacing: 2) {
                        Text("\(metrics.lifePct)%")
                            .font(.system(size: Design.bigPercentSize, weight: .bold))
                            .foregroundColor(Design.percent)
                        Text("of life lived")
                            .font(.system(size: Design.smallLabelSize, weight: .medium))
                            .foregroundColor(Design.grayLabel)
                    }
                }
                .padding(Design.contentPadding)
            )
        }

        return AnyView(
            EmberEmptyStateView(
                progress: cache.dayProgress,
                message: "Set birth date in UNTIL to see life progress."
            )
        )
    }

    private var placeholderView: some View {
        EmberEmptyStateView(
            progress: 0.32,
            message: "Open UNTIL — Ember is waiting with today’s light."
        )
    }
}

// MARK: - Shared widget background (glass look-alike; WidgetKit has no true blur)
private struct WidgetGlassBackground: View {
    var body: some View {
        ZStack {
            Design.background
            LinearGradient(
                colors: [
                    Color.white.opacity(0.07),
                    Color.white.opacity(0.02),
                    Color.black.opacity(0.22),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            // ContainerRelativeShape follows the system widget corner radius,
            // so the rim never renders as a mismatched inner rectangle.
            ContainerRelativeShape()
                .strokeBorder(Design.border, lineWidth: 1)
        }
    }
}

private extension View {
    func widgetBackground() -> some View {
        // containerBackground only — an extra .background() draws an unclipped
        // square layer under the content that reads as an inner "square shadow".
        containerBackground(for: .widget) {
            WidgetGlassBackground()
        }
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

struct LifeWidget: Widget {
    let kind: String = "UNTILLifeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MonthYearWidgetProvider()) { entry in
            LifeWidgetView(entry: entry)
        }
        .configurationDisplayName("Until Life")
        .description("See your life progress. Home screen and Lock Screen.")
        .supportedFamilies([.systemMedium, .accessoryInline, .accessoryCircular, .accessoryRectangular])
    }
}

// MARK: - Live Activity (Dynamic Island + Lock Screen)
// UNTILLiveActivityAttributes is defined in UNTIL/UNTILLiveActivityAttributes.swift (shared target)

private let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/// Progress color: green → amber → red (mirrors app `getProgressColor`).
private func liveActivityProgressColor(_ progress: Double) -> Color {
    let p = max(0, min(1, progress))
    let start = (r: 0x22 / 255.0, g: 0xC5 / 255.0, b: 0x5E / 255.0)
    let mid = (r: 0xF5 / 255.0, g: 0x9E / 255.0, b: 0x0B / 255.0)
    let end = (r: 0xEF / 255.0, g: 0x44 / 255.0, b: 0x44 / 255.0)
    let from: (r: Double, g: Double, b: Double)
    let to: (r: Double, g: Double, b: Double)
    let t: Double
    if p <= 0.5 {
        from = start; to = mid; t = p * 2
    } else {
        from = mid; to = end; t = (p - 0.5) * 2
    }
    return Color(
        red: from.r + (to.r - from.r) * t,
        green: from.g + (to.g - from.g) * t,
        blue: from.b + (to.b - from.b) * t
    )
}

private func liveActivityActiveWidget(
    _ context: ActivityViewContext<UNTILLiveActivityAttributes>
) -> String {
    context.state.activeWidget
}

private func liveActivityPrimaryProgress(
    _ context: ActivityViewContext<UNTILLiveActivityAttributes>
) -> Double {
    switch liveActivityActiveWidget(context) {
    case "month": return context.state.monthProgress
    case "year": return context.state.yearProgress
    case "life": return context.state.lifeProgress ?? Double(context.state.lifePercent ?? 0) / 100.0
    case "dailyTasks":
        let total = context.state.dailyTasksTotal
        return total > 0 ? Double(context.state.dailyTasksCompleted) / Double(total) : 0
    case "hourCalc": return 0
    default: return context.state.dayProgress
    }
}

private func liveActivityDayLeftText(_ context: ActivityViewContext<UNTILLiveActivityAttributes>) -> String {
    guard let end = context.state.endOfDay else {
        let h = Int(context.state.dayHoursLeft)
        let m = Int((context.state.dayHoursLeft - Double(h)) * 60)
        if h > 0 { return m > 0 ? "\(h)h \(m)m" : "\(h)h" }
        return "\(max(m, 0))m"
    }
    let nowMs = Int64(Date().timeIntervalSince1970 * 1000)
    let remainingMs = max(0, end - nowMs)
    let h = remainingMs / 3600000
    let m = (remainingMs % 3600000) / 60000
    if h > 0 { return m > 0 ? "\(h)h \(m)m" : "\(h)h" }
    return "\(m)m"
}

private func liveActivityHourCalcText(_ context: ActivityViewContext<UNTILLiveActivityAttributes>) -> String {
    let totalMs = context.state.hourCalcElapsedMs
    let totalSec = max(0, totalMs / 1000)
    let h = totalSec / 3600
    let m = (totalSec % 3600) / 60
    let s = totalSec % 60
    if h > 0 { return String(format: "%d:%02d:%02d", h, m, s) }
    return String(format: "%d:%02d", m, s)
}

private func liveActivityTypeIcon(_ type: String, progress: Double) -> String {
    switch type {
    case "month": return "calendar"
    case "year": return "globe.americas.fill"
    case "life": return "heart.fill"
    case "dailyTasks": return "checklist"
    case "hourCalc": return "timer"
    default:
        if progress < 0.35 { return "sun.max.fill" }
        if progress < 0.75 { return "sun.horizon.fill" }
        return "moon.stars.fill"
    }
}

/// Distinct brand color per mode (Life pink kept as the favorite).
private func liveActivityTypeAccent(_ type: String, progress: Double) -> Color {
    switch type {
    case "month": return Color(red: 0x2E / 255, green: 0xD3 / 255, blue: 0xC6 / 255) // teal
    case "year": return Color(red: 0x60 / 255, green: 0xA5 / 255, blue: 0xFA / 255) // sky blue
    case "life": return Color(red: 0xFF / 255, green: 0x6B / 255, blue: 0x6B / 255) // soft red
    case "dailyTasks": return Color(red: 0x4A / 255, green: 0xDE / 255, blue: 0x80 / 255)
    case "hourCalc": return Design.passedDot
    default: return liveActivityProgressColor(progress)
    }
}

private func liveActivityStickerBg(_ type: String) -> Color {
    liveActivityTypeAccent(type, progress: 0.5).opacity(0.22)
}

// MARK: Shared visuals

/// Motion profile for stickers (heart beats harder; others breathe / flicker).
private enum LiveActivityStickerMotion {
    case heartbeat
    case breathe
    case flicker
    case orbit
    case soft

    static func forSystemName(_ name: String) -> LiveActivityStickerMotion {
        switch name {
        case "heart.fill": return .heartbeat
        case "calendar", "checklist": return .flicker
        case "globe.americas.fill": return .orbit
        case "timer": return .breathe
        default:
            if name.contains("sun") || name.contains("moon") { return .breathe }
            return .soft
        }
    }
}

/// Circular “sticker” badge with a light live pulse (Dynamic Island / Lock Screen).
private struct LiveActivitySticker: View {
    let systemName: String
    let accent: Color
    var size: CGFloat = 28

    private var motion: LiveActivityStickerMotion {
        LiveActivityStickerMotion.forSystemName(systemName)
    }

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: false)) { context in
            let phase = pulsePhase(at: context.date)
            let scale = 1.0 + phase.scaleBoost
            let glow = 0.28 + phase.glowBoost
            ZStack {
                Circle()
                    .fill(accent.opacity(glow))
                    .frame(width: size + 6, height: size + 6)
                    .blur(radius: 5 + phase.blurBoost)
                    .scaleEffect(1.0 + phase.glowBoost * 0.35)
                Circle()
                    .fill(accent.opacity(0.22))
                    .frame(width: size, height: size)
                Circle()
                    .stroke(accent.opacity(0.55 + phase.glowBoost), lineWidth: 1.2)
                    .frame(width: size, height: size)
                    .shadow(color: accent.opacity(0.55 + phase.glowBoost), radius: 4 + phase.blurBoost, x: 0, y: 0)
                Image(systemName: systemName)
                    .font(.system(size: size * 0.42, weight: .semibold))
                    .foregroundColor(accent)
                    .symbolRenderingMode(.hierarchical)
                    .shadow(color: accent.opacity(0.55), radius: 3, x: 0, y: 0)
                    .modifier(LiveActivityStickerSymbolEffect(motion: motion))
                    .scaleEffect(scale)
                    .rotationEffect(.degrees(phase.rotationDegrees))
            }
            .frame(width: size + 6, height: size + 6)
        }
    }

    private struct PulsePhase {
        var scaleBoost: CGFloat
        var glowBoost: CGFloat
        var blurBoost: CGFloat
        var rotationDegrees: Double
    }

    private func pulsePhase(at date: Date) -> PulsePhase {
        let t = date.timeIntervalSinceReferenceDate
        switch motion {
        case .heartbeat:
            // Lub-dub: two quick peaks per cycle
            let cycle = t.truncatingRemainder(dividingBy: 1.05)
            let beat: Double
            if cycle < 0.12 {
                beat = sin((cycle / 0.12) * .pi)
            } else if cycle < 0.28 {
                beat = 0.55 * sin(((cycle - 0.14) / 0.14) * .pi)
            } else {
                beat = 0
            }
            return PulsePhase(
                scaleBoost: CGFloat(beat * 0.14),
                glowBoost: CGFloat(0.12 + beat * 0.35),
                blurBoost: CGFloat(beat * 2.5),
                rotationDegrees: 0
            )
        case .breathe:
            let s = (sin(t * 1.6) + 1) * 0.5
            return PulsePhase(
                scaleBoost: CGFloat(s * 0.07),
                glowBoost: CGFloat(0.08 + s * 0.22),
                blurBoost: CGFloat(s * 1.8),
                rotationDegrees: 0
            )
        case .flicker:
            let s = (sin(t * 2.4) + 1) * 0.5
            return PulsePhase(
                scaleBoost: CGFloat(s * 0.04),
                glowBoost: CGFloat(0.06 + s * 0.28),
                blurBoost: CGFloat(s * 1.4),
                rotationDegrees: 0
            )
        case .orbit:
            let s = (sin(t * 1.2) + 1) * 0.5
            return PulsePhase(
                scaleBoost: CGFloat(s * 0.05),
                glowBoost: CGFloat(0.1 + s * 0.2),
                blurBoost: CGFloat(s * 1.6),
                rotationDegrees: (t * 18).truncatingRemainder(dividingBy: 360)
            )
        case .soft:
            let s = (sin(t * 1.1) + 1) * 0.5
            return PulsePhase(
                scaleBoost: CGFloat(s * 0.035),
                glowBoost: CGFloat(0.05 + s * 0.15),
                blurBoost: CGFloat(s * 1.2),
                rotationDegrees: 0
            )
        }
    }
}

/// SF Symbol continuous effects where the OS supports them (falls back to TimelineView pulse).
private struct LiveActivityStickerSymbolEffect: ViewModifier {
    let motion: LiveActivityStickerMotion

    func body(content: Content) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            switch motion {
            case .heartbeat:
                content.symbolEffect(.pulse, options: .repeating.speed(1.35), isActive: true)
            case .breathe, .soft:
                content.symbolEffect(.pulse, options: .repeating.speed(0.7), isActive: true)
            case .flicker:
                content.symbolEffect(.pulse, options: .repeating.speed(1.05), isActive: true)
            case .orbit:
                content.symbolEffect(.pulse, options: .repeating.speed(0.8), isActive: true)
            }
        } else {
            content
        }
    }
}

/// Workout-style colored pills with check / fill / empty (great for month weeks).
private struct LiveActivitySetPills: View {
    let progress: Double
    let accent: Color
    var count: Int = 12

    private var filledCount: Int {
        Int(floor(Double(count) * min(max(progress, 0), 1)))
    }

    private var partialIndex: Int? {
        let exact = Double(count) * min(max(progress, 0), 1)
        let floorVal = Int(floor(exact))
        if exact - Double(floorVal) > 0.08 && floorVal < count { return floorVal }
        return nil
    }

    private func pillColor(_ index: Int) -> Color {
        let third = max(count / 3, 1)
        if index < third { return Color(red: 0.35, green: 0.55, blue: 1.0) }
        if index < third * 2 { return accent }
        return Color(red: 0.75, green: 0.35, blue: 0.35)
    }

    var body: some View {
        HStack(spacing: 3) {
            ForEach(0..<count, id: \.self) { i in
                let color = pillColor(i)
                let done = i < filledCount
                let partial = partialIndex == i
                ZStack {
                    if done || partial {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(color.opacity(0.45))
                            .blur(radius: 3)
                            .padding(-1)
                    }
                    RoundedRectangle(cornerRadius: 4)
                        .fill(done ? color : color.opacity(0.18))
                        .overlay(
                            RoundedRectangle(cornerRadius: 4)
                                .stroke(color.opacity(done || partial ? 0.85 : 0.55), lineWidth: done || partial ? 1.2 : 1)
                        )
                        .shadow(color: (done || partial) ? color.opacity(0.7) : .clear, radius: 3, x: 0, y: 0)
                    if done {
                        Image(systemName: "checkmark")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.black.opacity(0.75))
                    } else if partial {
                        VStack(spacing: 0) {
                            Spacer(minLength: 0)
                            color.opacity(0.9)
                                .frame(height: 8)
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 18)
            }
        }
    }
}

/// Year: four season quarters as large chips (not the same as month milestones).
private struct LiveActivitySeasonQuarters: View {
    let progress: Double
    let accent: Color

    private let seasons = ["Spring", "Summer", "Fall", "Winter"]
    private let icons = ["leaf.fill", "sun.max.fill", "wind", "snowflake"]

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<4, id: \.self) { i in
                let threshold = Double(i) / 4.0
                let next = Double(i + 1) / 4.0
                let active = progress >= next
                let current = progress >= threshold && progress < next
                VStack(spacing: 3) {
                    ZStack {
                        if current {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(accent.opacity(0.4))
                                .blur(radius: 5)
                                .padding(-2)
                        }
                        RoundedRectangle(cornerRadius: 8)
                            .fill(active || current ? accent.opacity(current ? 0.35 : 0.22) : Design.progressBg)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(current ? accent : Color.clear, lineWidth: 1.5)
                            )
                            .shadow(color: current ? accent.opacity(0.8) : .clear, radius: 5, x: 0, y: 0)
                            .frame(height: 36)
                        Image(systemName: icons[i])
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(active || current ? accent : Design.grayLabel)
                            .shadow(color: current ? accent.opacity(0.7) : .clear, radius: 3, x: 0, y: 0)
                    }
                    Text(seasons[i])
                        .font(.system(size: 7, weight: .medium))
                        .foregroundColor(current ? Design.lightText : Design.grayLabel)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
                .frame(maxWidth: .infinity)
            }
        }
    }
}

private struct LiveActivityTickTrack: View {
    let progress: Double
    let accent: Color
    var tickCount: Int = 24

    var body: some View {
        GeometryReader { geo in
            let filled = Int(round(Double(tickCount) * min(max(progress, 0), 1)))
            HStack(spacing: max(1, geo.size.width / CGFloat(tickCount * 3))) {
                ForEach(0..<tickCount, id: \.self) { i in
                    RoundedRectangle(cornerRadius: 1)
                        .fill(i < filled ? accent : Design.progressBg)
                        .shadow(color: i < filled ? accent.opacity(0.55) : .clear, radius: 1.5, x: 0, y: 0)
                        .frame(maxWidth: .infinity)
                }
            }
        }
        .frame(height: 10)
    }
}

private struct LiveActivityMilestoneTrack: View {
    let progress: Double
    let accent: Color
    let labels: [String]

    var body: some View {
        VStack(spacing: 4) {
            GeometryReader { geo in
                let w = geo.size.width
                ZStack(alignment: .leading) {
                    Capsule().fill(Design.progressBg).frame(height: 4)
                    Capsule()
                        .fill(accent)
                        .frame(width: max(8, w * CGFloat(min(max(progress, 0), 1))), height: 4)
                    HStack {
                        ForEach(0..<labels.count, id: \.self) { i in
                            Circle()
                                .fill(Double(i) / Double(max(labels.count - 1, 1)) <= progress + 0.02 ? accent : Design.remainingDot)
                                .frame(width: 10, height: 10)
                            if i < labels.count - 1 { Spacer(minLength: 0) }
                        }
                    }
                }
            }
            .frame(height: 10)
            HStack {
                ForEach(Array(labels.enumerated()), id: \.offset) { _, label in
                    Text(label)
                        .font(.system(size: 8, weight: .medium))
                        .foregroundColor(Design.grayLabel)
                    if label != labels.last { Spacer(minLength: 0) }
                }
            }
        }
    }
}

private struct LiveActivityDayArc: View {
    let progress: Double
    let accent: Color

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            ZStack {
                Path { path in
                    path.addArc(
                        center: CGPoint(x: w / 2, y: h * 0.95),
                        radius: min(w * 0.45, h * 0.95),
                        startAngle: .degrees(200),
                        endAngle: .degrees(340),
                        clockwise: false
                    )
                }
                .stroke(Design.progressBg, style: StrokeStyle(lineWidth: 5, lineCap: .round))

                Path { path in
                    let end = 200 + (340 - 200) * min(max(progress, 0), 1)
                    path.addArc(
                        center: CGPoint(x: w / 2, y: h * 0.95),
                        radius: min(w * 0.45, h * 0.95),
                        startAngle: .degrees(200),
                        endAngle: .degrees(end),
                        clockwise: false
                    )
                }
                .stroke(
                    AngularGradient(
                        colors: [
                            Color(red: 0.2, green: 0.45, blue: 0.9),
                            accent,
                            Color(red: 1.0, green: 0.85, blue: 0.55)
                        ],
                        center: .center
                    ),
                    style: StrokeStyle(lineWidth: 5, lineCap: .round)
                )
                .shadow(color: accent.opacity(0.65), radius: 4, x: 0, y: 0)
            }
        }
        .frame(height: 28)
    }
}

// MARK: Lock Screen

private struct LiveActivityLockScreenView: View {
    let context: ActivityViewContext<UNTILLiveActivityAttributes>

    var body: some View {
        Group {
            switch liveActivityActiveWidget(context) {
            case "day": dayLock
            case "month": monthLock
            case "year": yearLock
            case "life": lifeLock
            case "dailyTasks": tasksLock
            case "hourCalc": hourLock
            default: dayLock
            }
        }
        .padding(16)
        .activityBackgroundTint(Design.background.opacity(0.92))
    }

    private var type: String { liveActivityActiveWidget(context) }
    private var progress: Double { liveActivityPrimaryProgress(context) }
    private var accent: Color { liveActivityTypeAccent(type, progress: progress) }

    private var dayLock: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                LiveActivitySticker(
                    systemName: liveActivityTypeIcon("day", progress: progress),
                    accent: accent,
                    size: 32
                )
                VStack(alignment: .leading, spacing: 2) {
                    Text("Today").font(.headline).foregroundColor(Design.lightText)
                    Text("Time left in your day")
                        .font(.caption)
                        .foregroundColor(Design.grayLabel)
                }
                Spacer()
                Text("\(context.state.dayPercentLeft)% left")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(accent)
            }
            Text(liveActivityDayLeftText(context))
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundColor(Design.left)
                .monospacedDigit()
            LiveActivityDayArc(progress: progress, accent: accent)
            HStack {
                Label("Dawn", systemImage: "sunrise.fill")
                    .font(.caption2)
                    .foregroundColor(Design.grayLabel)
                Spacer()
                Label("Night", systemImage: "moon.stars.fill")
                    .font(.caption2)
                    .foregroundColor(Design.grayLabel)
            }
        }
    }

    private var monthLock: some View {
        let monthIdx = Calendar.current.component(.month, from: Date()) - 1
        let monthName = monthNames[monthIdx]
        let leftPct = max(0, 100 - context.state.monthPercent)
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                LiveActivitySticker(systemName: "calendar", accent: accent, size: 32)
                VStack(alignment: .leading, spacing: 2) {
                    Text(monthName).font(.headline).foregroundColor(Design.lightText)
                    Text("Days left this month")
                        .font(.caption)
                        .foregroundColor(Design.grayLabel)
                }
                Spacer()
                Text("\(leftPct)% left")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(accent)
            }
            Text("\(context.state.monthDaysLeft)d")
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundColor(Design.left)
                .monospacedDigit()
            LiveActivitySetPills(progress: progress, accent: accent, count: 12)
            Text("\(context.state.monthDaysPassed)d passed")
                .font(.caption2)
                .foregroundColor(Design.grayLabel)
        }
    }

    private var yearLock: some View {
        let year = Calendar.current.component(.year, from: Date())
        let leftPct = max(0, 100 - context.state.yearPercent)
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                LiveActivitySticker(systemName: "globe.americas.fill", accent: accent, size: 32)
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(year)").font(.headline).foregroundColor(Design.lightText)
                    Text("Season of your year")
                        .font(.caption)
                        .foregroundColor(Design.grayLabel)
                }
                Spacer()
                Text("\(leftPct)% left")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(accent)
            }
            Text("\(context.state.yearDaysLeft)d")
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundColor(Design.left)
                .monospacedDigit()
            LiveActivitySeasonQuarters(progress: progress, accent: accent)
        }
    }

    private var lifeLock: some View {
        let lifePct = context.state.lifePercent ?? 0
        let daysLeft = context.state.remainingDaysLife ?? 0
        let leftPct = max(0, 100 - lifePct)
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                LiveActivitySticker(systemName: "heart.fill", accent: accent, size: 32)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Your life").font(.headline).foregroundColor(Design.lightText)
                    Text("\(lifePct)% lived")
                        .font(.caption)
                        .foregroundColor(Design.grayLabel)
                }
                Spacer()
                Text("\(leftPct)% left")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(accent)
            }
            Text("\(daysLeft)")
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundColor(Design.left)
                .monospacedDigit()
            Text("Days left")
                .font(.caption)
                .foregroundColor(Design.grayLabel)
            LiveActivityTickTrack(progress: progress, accent: accent, tickCount: 32)
        }
    }

    private var tasksLock: some View {
        let total = context.state.dailyTasksTotal
        let done = context.state.dailyTasksCompleted
        let left = max(0, total - done)
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                LiveActivitySticker(systemName: "checklist", accent: accent, size: 32)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Tasks").font(.headline).foregroundColor(Design.lightText)
                    Text(left == 1 ? "1 left today" : "\(left) left today")
                        .font(.caption)
                        .foregroundColor(Design.grayLabel)
                }
                Spacer()
                Text("\(done)/\(total)")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(accent)
            }
            if total > 0 {
                LiveActivitySetPills(progress: progress, accent: accent, count: min(max(total, 4), 12))
            }
        }
    }

    private var hourLock: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                LiveActivitySticker(systemName: "timer", accent: Design.passedDot, size: 32)
                VStack(alignment: .leading, spacing: 2) {
                    Text(context.state.hourCalcTitle.isEmpty ? "Timer" : context.state.hourCalcTitle)
                        .font(.headline)
                        .foregroundColor(Design.lightText)
                    Text(context.state.hourCalcIsRunning ? "Running" : "Paused")
                        .font(.caption)
                        .foregroundColor(context.state.hourCalcIsRunning ? Design.passedDot : Design.grayLabel)
                }
                Spacer()
            }
            Text(liveActivityHourCalcText(context))
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundColor(Design.passedDot)
                .monospacedDigit()
            LiveActivityTickTrack(progress: 0.35, accent: Design.passedDot, tickCount: 20)
        }
    }
}

// MARK: Compact / Minimal (inspiration: icon + metric pill)

private struct LiveActivityCompactLeadingView: View {
    let context: ActivityViewContext<UNTILLiveActivityAttributes>

    var body: some View {
        let type = liveActivityActiveWidget(context)
        let progress = liveActivityPrimaryProgress(context)
        let accent = liveActivityTypeAccent(type, progress: progress)
        LiveActivitySticker(
            systemName: liveActivityTypeIcon(type, progress: progress),
            accent: accent,
            size: 22
        )
    }
}

private struct LiveActivityCompactTrailingView: View {
    let context: ActivityViewContext<UNTILLiveActivityAttributes>

    var body: some View {
        let type = liveActivityActiveWidget(context)
        let progress = liveActivityPrimaryProgress(context)
        let accent = liveActivityTypeAccent(type, progress: progress)
        Text(compactMetric)
            .font(.system(size: 13, weight: .bold, design: .rounded))
            .foregroundColor(accent)
            .monospacedDigit()
            .lineLimit(1)
            .minimumScaleFactor(0.75)
    }

    private var compactMetric: String {
        switch liveActivityActiveWidget(context) {
        case "month": return "\(context.state.monthDaysLeft)d"
        case "year": return "\(context.state.yearDaysLeft)d"
        case "life":
            let left = max(0, 100 - (context.state.lifePercent ?? 0))
            return "\(left)%"
        case "dailyTasks":
            return "\(max(0, context.state.dailyTasksTotal - context.state.dailyTasksCompleted))"
        case "hourCalc":
            return liveActivityHourCalcText(context)
        default:
            return liveActivityDayLeftText(context)
        }
    }
}

private struct LiveActivityMinimalView: View {
    let context: ActivityViewContext<UNTILLiveActivityAttributes>

    var body: some View {
        let type = liveActivityActiveWidget(context)
        let progress = liveActivityPrimaryProgress(context)
        let accent = liveActivityTypeAccent(type, progress: progress)
        LiveActivitySticker(
            systemName: liveActivityTypeIcon(type, progress: progress),
            accent: accent,
            size: 18
        )
    }
}

// MARK: Expanded (unique layout per type)

private struct LiveActivityExpandedContentView: View {
    let context: ActivityViewContext<UNTILLiveActivityAttributes>

    var body: some View {
        switch liveActivityActiveWidget(context) {
        case "day": expandedDay
        case "month": expandedMonth
        case "year": expandedYear
        case "life": expandedLife
        case "dailyTasks": expandedTasks
        case "hourCalc": expandedHour
        default: expandedDay
        }
    }

    private var progress: Double { liveActivityPrimaryProgress(context) }

    private var expandedDay: some View {
        let accent = liveActivityTypeAccent("day", progress: progress)
        return VStack(spacing: 5) {
            HStack(spacing: 8) {
                LiveActivitySticker(
                    systemName: liveActivityTypeIcon("day", progress: progress),
                    accent: accent,
                    size: 24
                )
                VStack(alignment: .leading, spacing: 1) {
                    Text("Today")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Design.lightText)
                    Text("Time left today")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(Design.grayLabel)
                }
                Spacer(minLength: 4)
                Text("\(context.state.dayPercentLeft)%")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(accent)
            }
            Text(liveActivityDayLeftText(context))
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundColor(Design.left)
                .monospacedDigit()
                .frame(maxWidth: .infinity, alignment: .leading)
            LiveActivityDayArc(progress: progress, accent: accent)
        }
    }

    private var expandedMonth: some View {
        let monthIdx = Calendar.current.component(.month, from: Date()) - 1
        let monthName = monthNames[monthIdx]
        let accent = liveActivityTypeAccent("month", progress: progress)
        let leftPct = max(0, 100 - context.state.monthPercent)
        return VStack(spacing: 5) {
            HStack(spacing: 8) {
                LiveActivitySticker(systemName: "calendar", accent: accent, size: 24)
                VStack(alignment: .leading, spacing: 1) {
                    Text(monthName)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Design.lightText)
                    Text("Month · \(leftPct)% left")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(Design.grayLabel)
                }
                Spacer(minLength: 4)
                Text("\(context.state.monthDaysLeft)d")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundColor(accent)
                    .monospacedDigit()
            }
            LiveActivitySetPills(progress: progress, accent: accent, count: 12)
            Text("\(context.state.monthDaysPassed)d already passed")
                .font(.system(size: 8, weight: .medium))
                .foregroundColor(Design.grayLabel)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var expandedYear: some View {
        let year = Calendar.current.component(.year, from: Date())
        let accent = liveActivityTypeAccent("year", progress: progress)
        let leftPct = max(0, 100 - context.state.yearPercent)
        return VStack(spacing: 5) {
            HStack(spacing: 8) {
                LiveActivitySticker(systemName: "globe.americas.fill", accent: accent, size: 24)
                VStack(alignment: .leading, spacing: 1) {
                    Text("\(year)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Design.lightText)
                    Text("\(context.state.yearDaysLeft) days left · \(leftPct)%")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(Design.grayLabel)
                }
                Spacer(minLength: 4)
            }
            LiveActivitySeasonQuarters(progress: progress, accent: accent)
        }
    }

    private var expandedLife: some View {
        let lifePct = context.state.lifePercent ?? 0
        let daysLeft = context.state.remainingDaysLife ?? 0
        let leftPct = max(0, 100 - lifePct)
        let accent = liveActivityTypeAccent("life", progress: progress)
        return VStack(spacing: 5) {
            HStack(spacing: 8) {
                LiveActivitySticker(systemName: "heart.fill", accent: accent, size: 24)
                VStack(alignment: .leading, spacing: 1) {
                    Text("Life")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Design.lightText)
                    Text("\(lifePct)% lived")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(Design.grayLabel)
                }
                Spacer(minLength: 4)
                Text("\(leftPct)% left")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(accent)
            }
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("\(daysLeft)")
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundColor(Design.left)
                    .monospacedDigit()
                Text("days left")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(Design.grayLabel)
                Spacer()
            }
            LiveActivityTickTrack(progress: progress, accent: accent, tickCount: 28)
        }
    }

    private var expandedTasks: some View {
        let total = context.state.dailyTasksTotal
        let done = context.state.dailyTasksCompleted
        let left = max(0, total - done)
        let accent = liveActivityTypeAccent("dailyTasks", progress: progress)
        return VStack(spacing: 5) {
            HStack(spacing: 8) {
                LiveActivitySticker(systemName: "checklist", accent: accent, size: 24)
                VStack(alignment: .leading, spacing: 1) {
                    Text("Tasks")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Design.lightText)
                    Text("\(done)/\(total) done")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(Design.grayLabel)
                }
                Spacer(minLength: 4)
                Text("\(left) left")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(accent)
            }
            if total > 0 {
                LiveActivitySetPills(progress: progress, accent: accent, count: min(max(total, 4), 12))
            }
        }
    }

    private var expandedHour: some View {
        VStack(spacing: 5) {
            HStack(spacing: 8) {
                LiveActivitySticker(systemName: "timer", accent: Design.passedDot, size: 24)
                VStack(alignment: .leading, spacing: 1) {
                    Text(context.state.hourCalcTitle.isEmpty ? "Timer" : context.state.hourCalcTitle)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Design.lightText)
                    Text(context.state.hourCalcIsRunning ? "Running" : "Paused")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(context.state.hourCalcIsRunning ? Design.passedDot : Design.grayLabel)
                }
                Spacer(minLength: 4)
            }
            Text(liveActivityHourCalcText(context))
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundColor(Design.passedDot)
                .monospacedDigit()
                .frame(maxWidth: .infinity, alignment: .leading)
            LiveActivityTickTrack(progress: 0.4, accent: Design.passedDot, tickCount: 20)
        }
    }
}

private struct LiveActivityExpandedBottomView: View {
    let context: ActivityViewContext<UNTILLiveActivityAttributes>

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "arrow.up.forward.app.fill")
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(Design.percent)
            Text(bottomHint)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(Design.grayLabel)
                .lineLimit(1)
            Spacer(minLength: 0)
            Text("Open")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(Design.lightText)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Capsule().fill(Design.percent.opacity(0.35)))
        }
    }

    private var bottomHint: String {
        switch liveActivityActiveWidget(context) {
        case "month": return "Month view in UNTIL"
        case "year": return "Year view in UNTIL"
        case "life": return "Life view in UNTIL"
        case "dailyTasks": return "Today's tasks"
        case "hourCalc": return "Hour timer"
        default: return "Day view in UNTIL"
        }
    }
}

struct UNTILLiveActivityWidget: Widget {
    private static let appURL = URL(string: "until://")!

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: UNTILLiveActivityAttributes.self) { context in
            Link(destination: Self.appURL) {
                LiveActivityLockScreenView(context: context)
            }
            .buttonStyle(.plain)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.center, priority: 1) {
                    Link(destination: Self.appURL) {
                        LiveActivityExpandedContentView(context: context)
                            .padding(.horizontal, 4)
                    }
                    .buttonStyle(.plain)
                }
                DynamicIslandExpandedRegion(.bottom, priority: 0.6) {
                    Link(destination: Self.appURL) {
                        LiveActivityExpandedBottomView(context: context)
                            .padding(.horizontal, 6)
                            .padding(.bottom, 2)
                    }
                    .buttonStyle(.plain)
                }
            } compactLeading: {
                LiveActivityCompactLeadingView(context: context)
            } compactTrailing: {
                LiveActivityCompactTrailingView(context: context)
            } minimal: {
                LiveActivityMinimalView(context: context)
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
        LifeWidget()
        CounterWidget()
        CountdownWidget()
        DailyTasksWidget()
        HourCalculationWidget()
        UNTILLiveActivityWidget()
    }
}
