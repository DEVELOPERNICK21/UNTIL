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

// MARK: - Gallery sample data
/// Believable numbers for the widget picker. Without these the gallery shows the empty
/// "Open UNTIL" state, which does not sell the widget. Only used when `context.isPreview`
/// is true (and as the redacted placeholder), never for a widget on the home screen.
private extension WidgetCache {
    static func gallerySample(at now: Date = Date()) -> WidgetCache {
        let cal = Calendar.current
        let start = cal.startOfDay(for: now)
        let end = cal.date(byAdding: .day, value: 1, to: start) ?? now
        let month = cal.component(.month, from: now) - 1
        return WidgetCache(
            dayProgress: 0.46,
            dayPercentDone: 46,
            dayPercentLeft: 54,
            dayHoursPassed: 11.0,
            dayHoursLeft: 13.0,
            dayPassedMinutes: 660,
            dayRemainingMinutes: 780,
            startOfDay: Int64(start.timeIntervalSince1970 * 1000),
            endOfDay: Int64(end.timeIntervalSince1970 * 1000),
            monthProgress: 0.48,
            monthIndex: month,
            monthDaysPassed: 15,
            monthDaysLeft: 16,
            monthPercent: 48,
            yearProgress: 0.62,
            yearDaysPassed: 226,
            yearDaysLeft: 139,
            yearPercent: 62,
            lifeProgress: 0.34,
            remainingDaysLife: 19_300,
            lifePercent: 34,
            presenceStreakCount: 6,
            presenceStreakDots: [true, true, true, true, true, true, false],
            updatedAt: Int64(now.timeIntervalSince1970 * 1000)
        )
    }
}

/// A date 24 days out (YYYY-MM-DD) for the countdown widget sample.
private let galleryCountdownDate: String = {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: Calendar.current.date(byAdding: .day, value: 24, to: Date()) ?? Date())
}()

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

// MARK: - Shared widget type styles
// One visual, one hero number, at most one line of new context per widget.
// Never show the same fact twice (percent + passed + left + bar).

private struct WidgetOverline: View {
    let text: String

    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 10, weight: .bold))
            .tracking(1.2)
            .foregroundColor(Design.grayLabel)
            .lineLimit(1)
    }
}

/// Big number with an optional small unit beside it: "30 days left".
private struct WidgetHero: View {
    let value: String
    var unit: String? = nil
    var size: CGFloat = 40
    var color: Color = Design.left

    var body: some View {
        HStack(alignment: .lastTextBaseline, spacing: 5) {
            Text(value)
                .font(.system(size: size, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundColor(color)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
            if let unit {
                Text(unit)
                    .font(.system(size: max(12, size * 0.34), weight: .semibold, design: .rounded))
                    .foregroundColor(Design.grayLabel)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
        }
    }
}

private func widgetCaption(_ text: String) -> some View {
    Text(text)
        .font(.system(size: 12, weight: .medium))
        .foregroundColor(Design.grayLabel)
        .lineLimit(1)
}

/// "THU · 1 OCT"
private func widgetDateOverline(_ now: Date) -> String {
    let f = DateFormatter()
    f.locale = Locale.current
    f.setLocalizedDateFormatFromTemplate("EEE d MMM")
    return f.string(from: now)
}

private func widgetMonthName(_ now: Date = Date()) -> String {
    let cal = Calendar.current
    let i = max(0, min(11, cal.component(.month, from: now) - 1))
    return cal.monthSymbols[i]
}

private func daysText(_ n: Int) -> String {
    n == 1 ? "1 day left" : "\(n) days left"
}

/// Days of the month laid out like a calendar (7 columns, weekday aligned).
/// Past days are muted, today is the accent, days ahead are faint.
private struct MonthDaysGridView: View {
    let daysInMonth: Int
    /// 1-based number of today.
    let today: Int
    /// Empty cells before day 1 so the weekdays line up with the locale's first weekday.
    let leadingBlanks: Int

    var body: some View {
        GeometryReader { geo in
            let cols = 7
            let rows = max(1, Int(ceil(Double(leadingBlanks + daysInMonth) / Double(cols))))
            let gap: CGFloat = 5
            let cell = max(
                3,
                min(
                    (geo.size.width - gap * CGFloat(cols - 1)) / CGFloat(cols),
                    (geo.size.height - gap * CGFloat(rows - 1)) / CGFloat(rows)
                )
            )
            VStack(spacing: gap) {
                ForEach(0..<rows, id: \.self) { r in
                    HStack(spacing: gap) {
                        ForEach(0..<cols, id: \.self) { c in
                            dot(day: r * cols + c - leadingBlanks + 1, size: cell)
                        }
                    }
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
    }

    @ViewBuilder
    private func dot(day: Int, size: CGFloat) -> some View {
        if day < 1 || day > daysInMonth {
            Color.clear.frame(width: size, height: size)
        } else if day < today {
            Circle().fill(Design.passedDot.opacity(0.6)).frame(width: size, height: size)
        } else if day == today {
            Circle().fill(Design.currentDot).frame(width: size, height: size)
        } else {
            Circle().fill(Design.remainingDot).frame(width: size, height: size)
        }
    }
}

/// Number of blank cells before the 1st so a month lines up under weekday headers.
private func monthLeadingBlanks(for date: Date) -> Int {
    let cal = Calendar.current
    guard let first = cal.date(from: cal.dateComponents([.year, .month], from: date)) else { return 0 }
    let weekday = cal.component(.weekday, from: first) // 1 = Sunday
    return (weekday - cal.firstWeekday + 7) % 7
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
        UNTILWidgetEntry(date: Date(), cache: .gallerySample())
    }

    func getSnapshot(in context: Context, completion: @escaping (UNTILWidgetEntry) -> Void) {
        let cache = loadWidgetCache()
        completion(UNTILWidgetEntry(date: Date(), cache: context.isPreview && cache == nil ? .gallerySample() : cache))
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
        UNTILWidgetEntry(date: Date(), cache: .gallerySample())
    }

    func getSnapshot(in context: Context, completion: @escaping (UNTILWidgetEntry) -> Void) {
        let cache = loadWidgetCache()
        completion(UNTILWidgetEntry(date: Date(), cache: context.isPreview && cache == nil ? .gallerySample() : cache))
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
        UNTILWidgetEntry(date: Date(), cache: .gallerySample())
    }

    func getSnapshot(in context: Context, completion: @escaping (UNTILWidgetEntry) -> Void) {
        let cache = loadWidgetCache()
        completion(UNTILWidgetEntry(date: Date(), cache: context.isPreview && cache == nil ? .gallerySample() : cache))
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

extension DailyTaskWidgetPayload {
    /// Gallery sample: a day with work in progress.
    static var gallerySample: DailyTaskWidgetPayload {
        DailyTaskWidgetPayload(
            date: "",
            completed: 3,
            total: 5,
            pending: 2,
            byCategory: [
                "work": DailyTaskCategoryStats(completed: 2, total: 3),
                "health": DailyTaskCategoryStats(completed: 1, total: 1),
                "learning": DailyTaskCategoryStats(completed: 0, total: 1),
            ]
        )
    }
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
        DailyTasksWidgetEntry(date: Date(), payload: .gallerySample, dayCache: .gallerySample())
    }

    func getSnapshot(in context: Context, completion: @escaping (DailyTasksWidgetEntry) -> Void) {
        if context.isPreview {
            completion(DailyTasksWidgetEntry(date: Date(), payload: .gallerySample, dayCache: .gallerySample()))
            return
        }
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
                        .fill(Design.percent)
                    Circle()
                        .fill(Design.background)
                        .scaleEffect(innerRatio)
                } else {
                    let start = Angle.degrees(-90)
                    let end = start + Angle.degrees(360 * progress)
                    DailyTasksDonutSectorShape(startAngle: start, endAngle: end, innerRatio: innerRatio)
                        .fill(Design.percent)
                    DailyTasksDonutSectorShape(startAngle: end, endAngle: start + .degrees(360), innerRatio: innerRatio)
                        .fill(Design.progressBg)
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

private let dailyTasksCategoryColors: [String: Color] = [
    "health": Color(red: 0x4A / 255, green: 0xDE / 255, blue: 0x80 / 255),
    "work": Color(red: 0x60 / 255, green: 0xA5 / 255, blue: 0xFA / 255),
    "personal_care": Color(red: 0xF4 / 255, green: 0x72 / 255, blue: 0xB6 / 255),
    "learning": Color(red: 0xBB / 255, green: 0x86 / 255, blue: 0xFC / 255),
    "other": Color(red: 0x8A / 255, green: 0x8A / 255, blue: 0x8E / 255),
]

private struct TaskCategoryRow: Identifiable {
    let key: String
    let label: String
    let stats: DailyTaskCategoryStats
    var id: String { key }
}

/// Large Tasks widget footer: the one thing the day adds. No percent, no bar.
private struct DailyTasksDaySection: View {
    let cache: WidgetCache
    var now: Date = Date()

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Rectangle()
                .fill(Design.progressBg.opacity(0.7))
                .frame(height: 1)
            HStack {
                WidgetOverline(text: "Today")
                Spacer(minLength: 0)
                Text(dayTimeLeftText(cache, now: now))
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundColor(Design.lightText)
                    .monospacedDigit()
            }
        }
        .padding(.horizontal, 18)
        .padding(.bottom, 18)
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

    private func categoryRows(_ payload: DailyTaskWidgetPayload) -> [TaskCategoryRow] {
        (payload.byCategory ?? [:])
            .filter { $0.value.total > 0 }
            .sorted { $0.key < $1.key }
            .map { TaskCategoryRow(key: $0.key, label: dailyTasksCategoryLabels[$0.key] ?? $0.key, stats: $0.value) }
    }

    private func paddedContent(payload: DailyTaskWidgetPayload) -> some View {
        let total = payload.total
        let completed = payload.completed
        let small = family == .systemSmall
        let rows = categoryRows(payload)

        return VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .center) {
                WidgetOverline(text: small ? "Tasks" : "Today's tasks")
                Spacer(minLength: 0)
                EmberGlyph(progress: entry.dayCache?.dayProgress ?? 0.35, size: 20)
            }
            Spacer(minLength: 8)

            // The donut shows the share done; the number is the count. Nothing else repeats them.
            HStack(alignment: .center, spacing: small ? 12 : 16) {
                DailyTasksPieShape(completed: completed, total: total, size: small ? 62 : 84, innerRatio: 0.62)
                VStack(alignment: .leading, spacing: 2) {
                    WidgetHero(value: "\(completed)/\(total)", size: small ? 26 : 34)
                    widgetCaption(total == 0 ? "add one in UNTIL" : "done")
                }
                if family == .systemMedium {
                    Spacer(minLength: 0)
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(rows.prefix(3)) { row in
                            categoryLine(row.key, row.label, row.stats)
                        }
                    }
                    .frame(maxWidth: 120, alignment: .leading)
                }
            }

            if family == .systemLarge && !rows.isEmpty {
                VStack(spacing: 10) {
                    ForEach(rows.prefix(5)) { row in
                        categoryLine(row.key, row.label, row.stats)
                    }
                }
                .padding(.top, 18)
            }
            Spacer(minLength: 0)
        }
        .padding(small ? 14 : 18)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    private func categoryLine(_ key: String, _ label: String, _ stats: DailyTaskCategoryStats) -> some View {
        HStack(spacing: 8) {
            Circle()
                .fill(dailyTasksCategoryColors[key] ?? Design.grayLabel)
                .frame(width: 7, height: 7)
            Text(label)
                .font(.system(size: 12))
                .foregroundColor(Design.grayLabel)
                .lineLimit(1)
            Spacer(minLength: 4)
            Text("\(stats.completed)/\(stats.total)")
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundColor(Design.lightText)
                .monospacedDigit()
        }
    }

    private var placeholderView: some View {
        EmberEmptyStateView(
            progress: entry.dayCache?.dayProgress ?? 0.35,
            message: "No tasks for today. Add one in UNTIL."
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
        .description("Today's tasks, by category. Large also shows time left today. Add tasks in UNTIL.")
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
    /// Columns in the grid. The large widget uses fewer, taller rows so the dots fill it.
    var cols: Int = 30
    /// Horizontal inset so dots don't touch widget edges
    private let horizontalInset: CGFloat = 8

    private let totalDots = 365
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
        // yearDaysPassed counts today, so today is the last of those days: it gets the accent
        // dot, the days before it are purple, and the gray dots match "days left".
        let todayNumber = min(max(yearDaysPassed, 0), totalDots)
        let passedDots = max(todayNumber - 1, 0)
        let currentDay = todayNumber >= 1 ? todayNumber - 1 : -1
        let size = cellSize
        let scale = scaleToFit

        LazyVGrid(columns: Array(repeating: GridItem(.fixed(size), spacing: gap), count: cols), spacing: gap) {
            ForEach(0..<totalDots, id: \.self) { i in
                let base = min(size / 2, max(dotRadius, size * 0.38))
                let radius = (i == currentDay && currentDay >= 0) ? min(size / 2, base * 1.25) : base
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
                let base = min(size / 2, max(dotRadius, size * 0.38))
                let radius = (i == currentDot && currentDot >= 0) ? min(size / 2, base * 1.25) : base
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
/// "21h 6m" (no unit word). Put "left" in the label beside it.
private func dayTimeLeftValue(_ cache: WidgetCache, now: Date = Date()) -> String {
    if let end = cache.endOfDay {
        let remainingSec = max(0, Int(Double(end) / 1000 - now.timeIntervalSince1970))
        return "\(remainingSec / 3600)h \((remainingSec % 3600) / 60)m"
    }
    if let rm = cache.dayRemainingMinutes {
        return "\(rm / 60)h \(rm % 60)m"
    }
    return "\(Int(cache.dayHoursLeft))h 0m"
}

private func dayTimeLeftText(_ cache: WidgetCache, now: Date = Date()) -> String {
    "\(dayTimeLeftValue(cache, now: now)) left"
}

// MARK: - Lock Screen Accessory Views (accessoryInline, accessoryCircular, accessoryRectangular)
// MARK: Lock Screen building blocks (one number and one bar, nothing repeated)
private struct AccessoryBarRect: View {
    let title: String
    let value: String
    let progress: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Design.grayLabel)
            Text(value)
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundColor(Design.lightText)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3).fill(Design.progressBg)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Design.progressOrange)
                        .frame(width: max(0, geo.size.width * CGFloat(min(1, max(0, progress)))))
                }
            }
            .frame(height: 6)
        }
    }
}

private struct AccessoryInlineText: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(Design.lightText)
    }
}

private struct DayAccessoryInlineView: View {
    let cache: WidgetCache
    var now: Date = Date()

    var body: some View {
        AccessoryInlineText(text: "\(dayTimeLeftText(cache, now: now)) today")
    }
}

private struct DayAccessoryRectangularView: View {
    let cache: WidgetCache
    var now: Date = Date()

    var body: some View {
        AccessoryBarRect(title: "Today", value: dayTimeLeftText(cache, now: now), progress: cache.dayProgress)
    }
}

private struct MonthAccessoryInlineView: View {
    let cache: WidgetCache

    var body: some View {
        AccessoryInlineText(text: "\(cache.monthDaysLeft) days left in \(widgetMonthName())")
    }
}

private struct MonthAccessoryRectangularView: View {
    let cache: WidgetCache

    var body: some View {
        AccessoryBarRect(title: widgetMonthName(), value: daysText(cache.monthDaysLeft), progress: cache.monthProgress)
    }
}

private struct YearAccessoryInlineView: View {
    let cache: WidgetCache

    var body: some View {
        AccessoryInlineText(text: "\(cache.yearDaysLeft) days left in \(Calendar.current.component(.year, from: Date()))")
    }
}

private struct YearAccessoryRectangularView: View {
    let cache: WidgetCache

    var body: some View {
        AccessoryBarRect(
            title: "\(Calendar.current.component(.year, from: Date()))",
            value: daysText(cache.yearDaysLeft),
            progress: cache.yearProgress
        )
    }
}

private struct LifeAccessoryInlineView: View {
    let cache: WidgetCache

    var body: some View {
        if let metrics = lifeYearMetrics(from: cache) {
            AccessoryInlineText(text: "\(formatYears(metrics.leftYears)) years left")
        } else {
            AccessoryInlineText(text: "Set birth date in UNTIL")
        }
    }
}

private struct LifeAccessoryRectangularView: View {
    let cache: WidgetCache

    var body: some View {
        if let metrics = lifeYearMetrics(from: cache) {
            AccessoryBarRect(
                title: "Your life",
                value: "\(formatYears(metrics.leftYears)) years left",
                progress: metrics.livedYears / Double(metrics.totalYears)
            )
        } else {
            VStack(alignment: .leading, spacing: 6) {
                Text("Your life")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Design.grayLabel)
                Text("Set birth date in UNTIL")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(Design.lightText)
            }
        }
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

// MARK: - Day large (ring + time left, then what else is running out)
private struct DayLargeView: View {
    let cache: WidgetCache
    var now: Date = Date()

    private let monthColor = Color(red: 0x2E / 255, green: 0xD3 / 255, blue: 0xC6 / 255)
    private let yearColor = Color(red: 0x60 / 255, green: 0xA5 / 255, blue: 0xFA / 255)
    private let lifeColor = Color(red: 0xFF / 255, green: 0x6B / 255, blue: 0x6B / 255)

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(spacing: 18) {
                DayRingView(progress: cache.dayProgress, size: 140)
                VStack(alignment: .leading, spacing: 4) {
                    WidgetOverline(text: widgetDateOverline(now))
                    WidgetHero(value: dayTimeLeftValue(cache, now: now), size: 38)
                    widgetCaption("left today")
                }
                Spacer(minLength: 0)
            }

            Rectangle()
                .fill(Design.progressBg.opacity(0.7))
                .frame(height: 1)

            // Other clocks that are running, each shown once. Month and Life are Premium.
            VStack(spacing: 12) {
                if WidgetCacheReader.isPremium {
                    row(color: monthColor, label: "This month", value: daysText(cache.monthDaysLeft))
                }
                row(color: yearColor, label: "This year", value: daysText(cache.yearDaysLeft))
                if WidgetCacheReader.isPremium, let m = lifeYearMetrics(from: cache) {
                    row(color: lifeColor, label: "Your life", value: "\(formatYears(m.leftYears)) years left")
                }
            }

            if cache.presenceStreakCount > 0 {
                HStack(spacing: 10) {
                    Text("\(cache.presenceStreakCount)-day streak")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Design.lightText)
                    Spacer(minLength: 0)
                    HStack(spacing: 5) {
                        ForEach(0..<cache.presenceStreakDots.count, id: \.self) { i in
                            Circle()
                                .fill(cache.presenceStreakDots[i] ? Design.percent : Design.remainingDot)
                                .frame(width: 8, height: 8)
                        }
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .padding(20)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    private func row(color: Color, label: String, value: String) -> some View {
        HStack(spacing: 10) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label)
                .font(.system(size: 13))
                .foregroundColor(Design.grayLabel)
            Spacer(minLength: 0)
            Text(value)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundColor(Design.lightText)
                .monospacedDigit()
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
                    DayLargeView(cache: cache, now: entry.date)
                case .systemSmall:
                    // The ring already shows how far through the day you are.
                    VStack(spacing: Design.stackSpacing) {
                        DayDotsView(progress: cache.dayProgress)
                            .frame(maxWidth: .infinity)
                            .layoutPriority(1)
                        Text(dayTimeLeftText(cache, now: entry.date))
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundColor(Design.left)
                            .monospacedDigit()
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }
                    .padding(Design.contentPadding)
                default: // .systemMedium
                    HStack(spacing: 18) {
                        DayDotsView(progress: cache.dayProgress)
                            .aspectRatio(1, contentMode: .fit)
                            .layoutPriority(1)
                        VStack(alignment: .leading, spacing: 4) {
                            WidgetOverline(text: widgetDateOverline(entry.date))
                            WidgetHero(value: dayTimeLeftValue(cache, now: entry.date), size: 36)
                            widgetCaption("left today")
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(Design.contentPadding)
                }
            } else {
                EmberEmptyStateView(
                    progress: 0.32,
                    message: "Open UNTIL once to load your time."
                )
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
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
                    message: "Month widget is Premium.\nOpen UNTIL to upgrade."
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
                EmberEmptyStateView(progress: 0.32, message: "Open UNTIL once to load your time.")
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }

    /// Calendar dots on the right show where you are; the number says how long is left.
    private func monthContent(cache: WidgetCache) -> some View {
        let daysInMonth = max(1, cache.monthDaysPassed + cache.monthDaysLeft)
        let today = min(daysInMonth, max(1, cache.monthDaysPassed))
        return HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                WidgetOverline(text: "\(widgetMonthName(entry.date)) \(Calendar.current.component(.year, from: entry.date))")
                Spacer(minLength: 0)
                WidgetHero(value: "\(cache.monthDaysLeft)", size: 52, color: Design.left)
                widgetCaption(cache.monthDaysLeft == 1 ? "day left" : "days left")
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            MonthDaysGridView(
                daysInMonth: daysInMonth,
                today: today,
                leadingBlanks: monthLeadingBlanks(for: entry.date)
            )
            .aspectRatio(7.0 / 5.4, contentMode: .fit)
        }
        .padding(16)
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
                EmberEmptyStateView(progress: 0.32, message: "Open UNTIL once to load your time.")
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }

    /// 365 dots are the progress; the header says how many days are left.
    private func yearContent(cache: WidgetCache) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            WidgetOverline(text: "\(Calendar.current.component(.year, from: entry.date))")
            WidgetHero(value: "\(cache.yearDaysLeft)", unit: cache.yearDaysLeft == 1 ? "day left" : "days left", size: 52)

            GeometryReader { geo in
                YearDotsView(
                    progress: cache.yearProgress,
                    yearDaysPassed: cache.yearDaysPassed,
                    availableWidth: geo.size.width,
                    availableHeight: geo.size.height,
                    cols: 20
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .frame(maxWidth: .infinity)
            .frame(minHeight: 96)
            .padding(.top, 8)
            .layoutPriority(1)
        }
        .padding(18)
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
                    message: "Life widget is Premium.\nOpen UNTIL to upgrade."
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
                EmberEmptyStateView(progress: 0.32, message: "Open UNTIL once to load your time.")
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
    }

    /// One dot per year of life. The number is what is left; the plan length is the only context.
    private func lifeContent(cache: WidgetCache) -> some View {
        guard let metrics = lifeYearMetrics(from: cache) else {
            return AnyView(
                EmberEmptyStateView(
                    progress: cache.dayProgress,
                    message: "Set your birth date in UNTIL to see your life."
                )
            )
        }
        let plan = cache.deathAge ?? metrics.totalYears
        return AnyView(
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    WidgetOverline(text: "Your life")
                    Spacer(minLength: 0)
                    WidgetHero(value: formatYears(metrics.leftYears), size: 44, color: Design.left)
                    widgetCaption("years left of \(plan)")
                    Spacer(minLength: 0)
                }
                .frame(width: 118, alignment: .leading)

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
            }
            .padding(16)
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
        CounterWidgetEntry(date: Date(), counter: CustomCounterItem(id: "sample", title: "Water", count: 5))
    }

    func getSnapshot(in context: Context, completion: @escaping (CounterWidgetEntry) -> Void) {
        let counter = loadFirstCounter()
        completion(CounterWidgetEntry(
            date: Date(),
            counter: context.isPreview && counter == nil
                ? CustomCounterItem(id: "sample", title: "Water", count: 5)
                : counter
        ))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CounterWidgetEntry>) -> Void) {
        let entry = CounterWidgetEntry(date: Date(), counter: loadFirstCounter())
        // A counter only changes when it is tapped, and the tap reloads this timeline itself.
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 6, to: Date()) ?? Date()
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

private func countdownDateText(_ dateString: String) -> String? {
    let parts = dateString.split(separator: "-").compactMap { Int($0) }
    guard parts.count >= 3,
          let date = Calendar.current.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))
    else { return nil }
    let f = DateFormatter()
    f.locale = Locale.current
    f.setLocalizedDateFormatFromTemplate("d MMM yyyy")
    return f.string(from: date)
}

private struct CounterWidgetView: View {
    let entry: CounterWidgetEntry

    var body: some View {
        Group {
            if let c = entry.counter {
                Button(intent: IncrementCounterIntent(counterId: c.id)) {
                    VStack(alignment: .leading, spacing: 0) {
                        Text(c.title)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(Design.lightText)
                            .lineLimit(1)
                        Spacer(minLength: 4)
                        Text("\(c.count)")
                            .font(.system(size: 54, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .foregroundColor(Design.left)
                            .lineLimit(1)
                            .minimumScaleFactor(0.5)
                            .contentTransition(.numericText())
                        Spacer(minLength: 4)
                        HStack {
                            Spacer(minLength: 0)
                            // The whole widget is the button; this only shows what a tap does.
                            Image(systemName: "plus")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.black.opacity(0.85))
                                .frame(width: 32, height: 32)
                                .background(Circle().fill(Design.percent))
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                    .padding(16)
                }
                .buttonStyle(.plain)
            } else {
                EmberEmptyStateView(progress: 0.3, message: "Add a counter in UNTIL.")
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
        .description("Tap to add +1. Create counters in UNTIL.")
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
        CountdownWidgetEntry(date: Date(), countdown: CountdownItem(id: "sample", title: "Launch day", date: galleryCountdownDate), daysLeft: 24)
    }

    func getSnapshot(in context: Context, completion: @escaping (CountdownWidgetEntry) -> Void) {
        if let (item, days) = loadFirstCountdown() {
            completion(CountdownWidgetEntry(date: Date(), countdown: item, daysLeft: days))
        } else if context.isPreview {
            completion(CountdownWidgetEntry(date: Date(), countdown: CountdownItem(id: "sample", title: "Launch day", date: galleryCountdownDate), daysLeft: 24))
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
                VStack(alignment: .leading, spacing: 0) {
                    Text(c.title)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Design.lightText)
                        .lineLimit(2)
                    Spacer(minLength: 4)
                    if entry.daysLeft == 0 {
                        WidgetHero(value: "Today", size: 38, color: Design.percent)
                    } else {
                        WidgetHero(value: "\(entry.daysLeft)", size: 54, color: Design.left)
                        widgetCaption(entry.daysLeft == 1 ? "day left" : "days left")
                    }
                    Spacer(minLength: 4)
                    if let when = countdownDateText(c.date) {
                        Text(when)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(Design.grayLabel)
                            .lineLimit(1)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .padding(16)
            } else {
                EmberEmptyStateView(progress: 0.3, message: "Add a deadline in UNTIL.")
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
        .description("Days left until a deadline. Add one in UNTIL.")
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

/// Running: a system timer that counts up by itself. Stopped: the banked time.
@ViewBuilder
private func hourCalculationElapsedText(state: HourCalculationState, now: Date) -> some View {
    if state.isRunning && state.startTimeMs > 0 {
        // Backdate by the time already banked so the timer shows the running total.
        let origin = Date(timeIntervalSince1970: Double(state.startTimeMs - state.totalElapsedMs) / 1000)
        Text(origin, style: .timer)
    } else {
        Text(formatHourCalculationElapsed(totalElapsedMs: state.totalElapsedMs, startTimeMs: state.startTimeMs, isRunning: false, now: now))
    }
}

struct HourCalculationWidgetEntry: TimelineEntry {
    let date: Date
    let state: HourCalculationState?
}

struct HourCalculationWidgetProvider: TimelineProvider {
    private func loadState() -> HourCalculationState? {
        guard let json = WidgetCacheReader.loadHourCalculationJSON(),
              let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(HourCalculationState.self, from: data)
    }

    private static let gallerySample = HourCalculationState(
        title: "Deep work", isRunning: false, startTimeMs: 0, totalElapsedMs: 4_980_000
    )

    func placeholder(in context: Context) -> HourCalculationWidgetEntry {
        HourCalculationWidgetEntry(date: Date(), state: Self.gallerySample)
    }

    func getSnapshot(in context: Context, completion: @escaping (HourCalculationWidgetEntry) -> Void) {
        let state = loadState()
        completion(HourCalculationWidgetEntry(
            date: Date(),
            state: context.isPreview && state == nil ? Self.gallerySample : state
        ))
    }

    /// One entry is enough: a running timer is drawn with `Text(_, style: .timer)`, which the
    /// system ticks by itself. (This used to build 60 per-second entries per refresh, which
    /// spends the widget's refresh budget for nothing.) Start/stop reload the timeline directly.
    func getTimeline(in context: Context, completion: @escaping (Timeline<HourCalculationWidgetEntry>) -> Void) {
        let now = Date()
        let entry = HourCalculationWidgetEntry(date: now, state: loadState())
        let refresh = Calendar.current.date(byAdding: .hour, value: 1, to: now) ?? now
        completion(Timeline(entries: [entry], policy: .after(refresh)))
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
                    VStack(alignment: .leading, spacing: 0) {
                        Text(state.title.isEmpty ? "Hour timer" : state.title)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(Design.lightText)
                            .lineLimit(1)
                        Spacer(minLength: 4)
                        hourCalculationElapsedText(state: state, now: entry.date)
                            .font(.system(size: 30, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .foregroundColor(Design.left)
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)
                        Spacer(minLength: 4)
                        // Says what the tap will do, instead of a hint line.
                        HStack(spacing: 6) {
                            Image(systemName: state.isRunning ? "pause.fill" : "play.fill")
                                .font(.system(size: 11, weight: .bold))
                            Text(state.isRunning ? "Stop" : "Start")
                                .font(.system(size: 13, weight: .bold, design: .rounded))
                        }
                        .foregroundColor(.black.opacity(0.85))
                        .padding(.horizontal, 14)
                        .frame(height: 30)
                        .background(Capsule().fill(Design.passedDot))
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                    .padding(16)
                }
                .buttonStyle(.plain)
            } else {
                EmberEmptyStateView(progress: 0.3, message: "Set a title in UNTIL, then tap to start.")
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
        .description("Tap to start or stop one timer. Set its title in UNTIL.")
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
// UNTILLiveActivityAttributes and the island button intents live in
// UNTIL/UNTILLiveActivityAttributes.swift (shared with the app target).
//
// Design rules for this section:
//  * Anything that changes every second (time left, progress, stopwatch) uses the
//    system's self-updating views (Text(timerInterval:), ProgressView(timerInterval:),
//    Text(_, style: .timer)). They tick with the app closed and cost no updates.
//  * No continuous animation. Live Activities are throttled by the system and a
//    30 fps timeline only burns battery. Changes animate through content transitions.
//  * One model feeds every region, so Lock Screen, expanded, compact and minimal
//    always agree.

/// What the island can show. Raw value is the string the app stores.
private enum IslandMode: String, CaseIterable {
    case day, month, year, life, dailyTasks, hourCalc

    init(_ raw: String) {
        self = IslandMode(rawValue: raw) ?? .day
    }

    var title: String {
        switch self {
        case .day: return "Today"
        case .month: return "This month"
        case .year: return "This year"
        case .life: return "Your life"
        case .dailyTasks: return "Tasks"
        case .hourCalc: return "Hour timer"
        }
    }

    /// Icon used on the small selector chips.
    var chipSymbol: String {
        switch self {
        case .day: return "sun.max.fill"
        case .month: return "calendar"
        case .year: return "globe.americas.fill"
        case .life: return "heart.fill"
        case .dailyTasks: return "checklist"
        case .hourCalc: return "timer"
        }
    }

    /// Month and Life are Premium in the app, so the island keeps them behind the paywall too.
    var requiresPremium: Bool {
        self == .month || self == .life
    }

    /// Screen in the app that matches this view (handled by `until://open/<Route>`).
    var route: String {
        switch self {
        case .day: return "DayDetail"
        case .month: return "MonthDetail"
        case .year: return "YearDetail"
        case .life: return "Life"
        case .dailyTasks: return "DailyTasks"
        case .hourCalc: return "HourCalculation"
        }
    }
}

/// Green → amber → red, mirrors the app's `getProgressColor`.
private func islandProgressColor(_ progress: Double) -> Color {
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

private struct IslandModel {
    let state: UNTILLiveActivityAttributes.ContentState
    let isStale: Bool
    var isPremium: Bool { state.isPremium }

    var mode: IslandMode { IslandMode(state.activeWidget) }

    /// Views offered on the selector. Life needs a birth date.
    var availableModes: [IslandMode] {
        IslandMode.allCases.filter { $0 != .life || state.lifeProgress != nil || state.lifePercent != nil }
    }

    var progress: Double {
        switch mode {
        case .day: return state.dayProgress
        case .month: return state.monthProgress
        case .year: return state.yearProgress
        case .life: return state.lifeProgress ?? Double(state.lifePercent ?? 0) / 100.0
        case .dailyTasks:
            return state.dailyTasksTotal > 0
                ? Double(state.dailyTasksCompleted) / Double(state.dailyTasksTotal)
                : 0
        case .hourCalc: return 0
        }
    }

    var accent: Color {
        switch mode {
        case .day: return islandProgressColor(state.dayProgress)
        case .month: return Color(red: 0x2E / 255, green: 0xD3 / 255, blue: 0xC6 / 255)
        case .year: return Color(red: 0x60 / 255, green: 0xA5 / 255, blue: 0xFA / 255)
        case .life: return Color(red: 0xFF / 255, green: 0x6B / 255, blue: 0x6B / 255)
        case .dailyTasks: return Color(red: 0x4A / 255, green: 0xDE / 255, blue: 0x80 / 255)
        case .hourCalc: return Design.passedDot
        }
    }

    var symbol: String {
        switch mode {
        case .day:
            if state.dayProgress < 0.35 { return "sun.max.fill" }
            if state.dayProgress < 0.75 { return "sun.horizon.fill" }
            return "moon.stars.fill"
        default:
            return mode.chipSymbol
        }
    }

    var title: String { mode == .hourCalc ? (state.hourCalcTitle.isEmpty ? "Hour timer" : state.hourCalcTitle) : mode.title }

    var subtitle: String {
        let cal = Calendar.current
        switch mode {
        case .day:
            return "Time left today"
        case .month:
            // The counts already include today, so "passed" is today's day number.
            let name = cal.shortMonthSymbols[max(0, min(11, cal.component(.month, from: Date()) - 1))]
            return "\(name) · day \(state.monthDaysPassed) of \(state.monthDaysPassed + state.monthDaysLeft)"
        case .year:
            let year = cal.component(.year, from: Date())
            return "\(year) · day \(state.yearDaysPassed) of \(state.yearDaysPassed + state.yearDaysLeft)"
        case .life:
            return "Of your expected life"
        case .dailyTasks:
            return state.dailyTasksTotal == 0
                ? "Plan your day in UNTIL"
                : "\(state.dailyTasksCompleted) of \(state.dailyTasksTotal) done"
        case .hourCalc:
            return state.hourCalcIsRunning ? "Running" : "Paused"
        }
    }

    /// Share left, shown top right. Nil when a percentage makes no sense.
    var trailingMetric: String? {
        switch mode {
        case .day: return "\(state.dayPercentLeft)%"
        case .month: return "\(max(0, 100 - state.monthPercent))%"
        case .year: return "\(max(0, 100 - state.yearPercent))%"
        case .life: return "\(max(0, 100 - (state.lifePercent ?? Int(progress * 100))))%"
        case .dailyTasks:
            return state.dailyTasksTotal == 0 ? nil : "\(state.dailyTasksCompleted)/\(state.dailyTasksTotal)"
        case .hourCalc: return nil
        }
    }

    var deepLink: URL {
        URL(string: "until://open/\(mode.route)") ?? URL(string: "until://")!
    }

    /// Span the progress bar fills over; the system advances it on its own.
    var progressInterval: ClosedRange<Date>? {
        let cal = Calendar.current
        let now = Date()
        switch mode {
        case .day:
            let start = state.startOfDay.map { Date(timeIntervalSince1970: Double($0) / 1000) }
                ?? cal.startOfDay(for: now)
            let end = dayEnd
            return start < end ? start...end : nil
        case .month:
            guard let i = cal.dateInterval(of: .month, for: now) else { return nil }
            return i.start...i.end
        case .year:
            guard let i = cal.dateInterval(of: .year, for: now) else { return nil }
            return i.start...i.end
        default:
            return nil
        }
    }

    var dayEnd: Date {
        if let end = state.endOfDay { return Date(timeIntervalSince1970: Double(end) / 1000) }
        let cal = Calendar.current
        return cal.date(byAdding: .day, value: 1, to: cal.startOfDay(for: Date())) ?? Date()
    }

    /// Start of the current run, backdated by time already banked, for `Text(_, style: .timer)`.
    var stopwatchOrigin: Date {
        let start = state.hourCalcStartMs ?? Int64(Date().timeIntervalSince1970 * 1000)
        return Date(timeIntervalSince1970: Double(start - state.hourCalcElapsedMs) / 1000)
    }

    var stoppedStopwatchText: String {
        let total = max(0, state.hourCalcElapsedMs / 1000)
        let h = total / 3600, m = (total % 3600) / 60, s = total % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
    }

    var staticDaysText: String {
        switch mode {
        case .month: return "\(state.monthDaysLeft)"
        case .year: return "\(state.yearDaysLeft)"
        case .life: return (state.remainingDaysLife ?? 0).formatted()
        case .dailyTasks:
            if state.dailyTasksTotal == 0 { return "No tasks yet" }
            let left = max(0, state.dailyTasksTotal - state.dailyTasksCompleted)
            return left == 0 ? "All done" : "\(left)"
        default: return ""
        }
    }

    var staticUnit: String {
        switch mode {
        case .month, .year, .life: return " days left"
        case .dailyTasks:
            let left = max(0, state.dailyTasksTotal - state.dailyTasksCompleted)
            return state.dailyTasksTotal == 0 || left == 0 ? "" : " to do"
        default: return ""
        }
    }
}

// MARK: Pieces

/// Round icon badge. Static on purpose.
private struct IslandBadge: View {
    let symbol: String
    let accent: Color
    var size: CGFloat = 28

    var body: some View {
        ZStack {
            Circle().fill(accent.opacity(0.20))
            Circle().strokeBorder(accent.opacity(0.65), lineWidth: 1)
            Image(systemName: symbol)
                .font(.system(size: size * 0.46, weight: .semibold))
                .foregroundColor(accent)
                .contentTransition(.symbolEffect(.replace))
        }
        .frame(width: size, height: size)
    }
}

/// The big number: live countdown, live stopwatch, or day counts.
private struct IslandPrimary: View {
    let model: IslandModel
    var size: CGFloat = 32
    var alignment: Alignment = .leading

    var body: some View {
        Group {
            switch model.mode {
            case .day:
                let now = Date()
                if model.dayEnd > now {
                    Text(timerInterval: now...model.dayEnd, pauseTime: nil, countsDown: true, showsHours: true)
                } else {
                    Text("0:00:00")
                }
            case .hourCalc:
                if model.state.hourCalcIsRunning {
                    Text(model.stopwatchOrigin, style: .timer)
                } else {
                    Text(model.stoppedStopwatchText)
                }
            default:
                (Text(model.staticDaysText)
                    + Text(model.staticUnit)
                    .font(.system(size: size * 0.45, weight: .semibold, design: .rounded))
                    .foregroundColor(Design.grayLabel))
                    .contentTransition(.numericText())
            }
        }
        .font(.system(size: size, weight: .bold, design: .rounded))
        .monospacedDigit()
        .foregroundColor(.white)
        .lineLimit(1)
        .minimumScaleFactor(0.6)
        .multilineTextAlignment(alignment == .center ? .center : .leading)
        .frame(maxWidth: .infinity, alignment: alignment)
    }
}

/// Fill bar that advances by itself for time based views.
private struct IslandProgress: View {
    let model: IslandModel

    var body: some View {
        Group {
            if let interval = model.progressInterval {
                ProgressView(timerInterval: interval, countsDown: false) {
                    EmptyView()
                } currentValueLabel: {
                    EmptyView()
                }
            } else if model.mode == .hourCalc {
                EmptyView()
            } else {
                ProgressView(value: min(1, max(0, model.progress)))
            }
        }
        .progressViewStyle(.linear)
        .tint(model.accent)
        .labelsHidden()
    }
}

/// Tappable view selector. Real buttons on iOS 17+: they switch the island without opening the app.
private struct IslandChips: View {
    let model: IslandModel

    var body: some View {
        HStack(spacing: 6) {
            ForEach(model.availableModes, id: \.self) { mode in
                let selected = mode == model.mode
                if mode.requiresPremium && !model.isPremium {
                    // Premium views open the paywall instead of switching.
                    Link(destination: URL(string: "until://open/Premium") ?? URL(string: "until://")!) {
                        ZStack(alignment: .topTrailing) {
                            Image(systemName: mode.chipSymbol)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(Design.grayLabel.opacity(0.6))
                                .frame(width: 34, height: 28)
                                .background(Capsule().fill(Color.white.opacity(0.06)))
                            Image(systemName: "lock.fill")
                                .font(.system(size: 7, weight: .bold))
                                .foregroundColor(Design.grayLabel)
                                .offset(x: -3, y: 3)
                        }
                    }
                    .accessibilityLabel("\(mode.title), Premium")
                } else {
                    Button(intent: SwitchIslandModeIntent(mode: mode.rawValue)) {
                        Image(systemName: mode.chipSymbol)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(selected ? Color.black.opacity(0.85) : Design.grayLabel)
                            .frame(width: 34, height: 28)
                            .background(
                                Capsule().fill(selected ? model.accent : Color.white.opacity(0.10))
                            )
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(mode.title)
                    .accessibilityAddTraits(selected ? .isSelected : [])
                }
            }
        }
    }
}

/// Start / stop for the hour timer. Only shown on that view.
private struct IslandTimerButton: View {
    let model: IslandModel

    var body: some View {
        Button(intent: ToggleIslandTimerIntent()) {
            HStack(spacing: 6) {
                Image(systemName: model.state.hourCalcIsRunning ? "pause.fill" : "play.fill")
                    .font(.system(size: 12, weight: .bold))
                Text(model.state.hourCalcIsRunning ? "Stop" : "Start")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
            }
            .foregroundColor(Color.black.opacity(0.85))
            .padding(.horizontal, 16)
            .frame(height: 30)
            .background(Capsule().fill(model.accent))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(model.state.hourCalcIsRunning ? "Stop hour timer" : "Start hour timer")
    }
}

// MARK: Regions

private struct IslandLockScreenView: View {
    let model: IslandModel

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                IslandBadge(symbol: model.symbol, accent: model.accent, size: 34)
                VStack(alignment: .leading, spacing: 1) {
                    Text(model.title)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Design.lightText)
                        .lineLimit(1)
                    Text(model.subtitle)
                        .font(.system(size: 12))
                        .foregroundColor(Design.grayLabel)
                        .lineLimit(1)
                }
                Spacer(minLength: 8)
                if let metric = model.trailingMetric {
                    Text(metric)
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundColor(model.accent)
                        .monospacedDigit()
                        .contentTransition(.numericText())
                }
            }
            IslandPrimary(model: model, size: 36)
            IslandProgress(model: model)
            HStack(spacing: 10) {
                IslandChips(model: model)
                Spacer(minLength: 0)
                if model.mode == .hourCalc {
                    IslandTimerButton(model: model)
                }
            }
            if model.isStale {
                Text("Open UNTIL to refresh")
                    .font(.system(size: 11))
                    .foregroundColor(Design.grayLabel)
            }
        }
        .padding(16)
        .activityBackgroundTint(Design.background.opacity(0.94))
        .activitySystemActionForegroundColor(Design.lightText)
    }
}

private struct IslandExpandedLeading: View {
    let model: IslandModel

    var body: some View {
        HStack(spacing: 8) {
            IslandBadge(symbol: model.symbol, accent: model.accent, size: 30)
            VStack(alignment: .leading, spacing: 1) {
                Text(model.title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Design.lightText)
                    .lineLimit(1)
                Text(model.subtitle)
                    .font(.system(size: 11))
                    .foregroundColor(Design.grayLabel)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
        }
    }
}

private struct IslandExpandedTrailing: View {
    let model: IslandModel

    var body: some View {
        if let metric = model.trailingMetric {
            VStack(alignment: .trailing, spacing: 0) {
                Text(metric)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundColor(model.accent)
                    .monospacedDigit()
                    .contentTransition(.numericText())
                Text(model.mode == .dailyTasks ? "done" : "left")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Design.grayLabel)
            }
        } else if model.mode == .hourCalc {
            IslandTimerButton(model: model)
        }
    }
}

private struct IslandExpandedBottom: View {
    let model: IslandModel

    var body: some View {
        VStack(spacing: 8) {
            IslandPrimary(model: model, size: 30, alignment: .center)
            IslandProgress(model: model)
            HStack {
                Spacer(minLength: 0)
                IslandChips(model: model)
                Spacer(minLength: 0)
            }
        }
        .padding(.top, 2)
    }
}

private struct IslandCompactTrailing: View {
    let model: IslandModel

    var body: some View {
        Group {
            switch model.mode {
            case .day:
                let now = Date()
                if model.dayEnd > now {
                    Text(timerInterval: now...model.dayEnd, pauseTime: nil, countsDown: true, showsHours: true)
                } else {
                    Text("0:00")
                }
            case .hourCalc:
                if model.state.hourCalcIsRunning {
                    Text(model.stopwatchOrigin, style: .timer)
                } else {
                    Text(model.stoppedStopwatchText)
                }
            case .month: Text("\(model.state.monthDaysLeft)d")
            case .year: Text("\(model.state.yearDaysLeft)d")
            case .life: Text(model.trailingMetric ?? "")
            case .dailyTasks:
                Text("\(max(0, model.state.dailyTasksTotal - model.state.dailyTasksCompleted))")
            }
        }
        .font(.system(size: 13, weight: .bold, design: .rounded))
        .monospacedDigit()
        .foregroundColor(model.accent)
        .lineLimit(1)
        .minimumScaleFactor(0.6)
        .multilineTextAlignment(.trailing)
        // Text(timerInterval:) is greedy; pin the width so the pill stays compact.
        .frame(width: 56, alignment: .trailing)
    }
}

/// Smallest form: a progress ring with the view's icon inside.
private struct IslandMinimal: View {
    let model: IslandModel

    var body: some View {
        ZStack {
            Circle().stroke(model.accent.opacity(0.25), lineWidth: 2)
            Circle()
                .trim(from: 0, to: max(0.04, min(1, model.progress)))
                .stroke(model.accent, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Image(systemName: model.symbol)
                .font(.system(size: 8, weight: .bold))
                .foregroundColor(model.accent)
        }
        .frame(width: 20, height: 20)
    }
}

struct UNTILLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: UNTILLiveActivityAttributes.self) { context in
            let model = IslandModel(state: context.state, isStale: context.isStale)
            return IslandLockScreenView(model: model)
                .widgetURL(model.deepLink)
        } dynamicIsland: { context in
            let model = IslandModel(state: context.state, isStale: context.isStale)
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    IslandExpandedLeading(model: model)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    IslandExpandedTrailing(model: model)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    IslandExpandedBottom(model: model)
                }
            } compactLeading: {
                IslandBadge(symbol: model.symbol, accent: model.accent, size: 22)
            } compactTrailing: {
                IslandCompactTrailing(model: model)
            } minimal: {
                IslandMinimal(model: model)
            }
            .keylineTint(model.accent)
            .widgetURL(model.deepLink)
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
