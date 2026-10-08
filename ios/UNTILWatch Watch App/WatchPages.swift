//
//  WatchPages.swift
//  Today, Month, Year and Life. All four are worked out from the watch clock, so they stay
//  right with the phone out of reach.
//

import SwiftUI

/// Frame shared by every page: scrolls at large text sizes, paints its own background.
struct WatchPage<Content: View>: View {
  let accent: Color
  let secondary: Color
  @ViewBuilder var content: () -> Content

  var body: some View {
    ScrollView {
      content()
        .padding(.horizontal, 10)
        .padding(.bottom, 16)
        .frame(maxWidth: .infinity)
    }
    .background {
      WatchPageBackground(accent: accent, secondary: secondary)
    }
  }
}

func watchCaption(_ text: String) -> some View {
  Text(text)
    .watchFont(12, .medium, relativeTo: .caption)
    .foregroundColor(WatchTheme.label)
    .lineLimit(1)
    .minimumScaleFactor(0.8)
}

// MARK: - Today

struct WatchTodayPage: View {
  let now: Date

  var body: some View {
    let parts = WatchPeriodMath.day(now: now)
    let (accent, secondary) = WatchTheme.accents(.today, progress: parts.progress)
    WatchPage(accent: accent, secondary: secondary) {
      VStack(spacing: 2) {
        HStack {
          WatchOverline(text: "Today", color: accent)
          Spacer(minLength: 0)
        }
        WatchSkyArc(progress: parts.progress, accent: accent)
          .frame(height: 84)
        WatchHero(value: parts.leftText, size: 34, glow: accent)
        watchCaption("left today")
      }
      .accessibilityElement(children: .ignore)
      .accessibilityLabel("Today. \(parts.hoursLeft) hours \(parts.minutesLeft) minutes left.")
    }
  }
}

// MARK: - Month

struct WatchMonthPage: View {
  let now: Date

  var body: some View {
    let parts = WatchPeriodMath.month(now: now)
    let (accent, secondary) = WatchTheme.accents(.month)
    WatchPage(accent: accent, secondary: secondary) {
      VStack(alignment: .leading, spacing: 8) {
        WatchPageHeader(kind: .month, title: parts.name, stage: WatchStickers.monthStage(progress: parts.progress), accent: accent)
        HStack(alignment: .center, spacing: 10) {
          VStack(alignment: .leading, spacing: 0) {
            WatchHero(value: "\(parts.daysLeft)", size: 46, glow: accent)
            watchCaption(parts.daysLeft == 1 ? "day left" : "days left")
          }
          WatchMonthGrid(day: parts.day, daysInMonth: parts.daysInMonth, leadingBlanks: parts.leadingBlanks, accent: accent)
            .aspectRatio(7.0 / 5.6, contentMode: .fit)
            .frame(maxWidth: .infinity)
            .accessibilityHidden(true)
        }
      }
      .accessibilityElement(children: .ignore)
      .accessibilityLabel("\(parts.name). Day \(parts.day) of \(parts.daysInMonth). \(parts.daysLeft) days left.")
    }
  }
}

// MARK: - Year

struct WatchYearPage: View {
  let now: Date

  var body: some View {
    let parts = WatchPeriodMath.year(now: now)
    let (accent, secondary) = WatchTheme.accents(.year)
    let month = Calendar.current.component(.month, from: now)
    WatchPage(accent: accent, secondary: secondary) {
      VStack(spacing: 2) {
        WatchPageHeader(kind: .year, title: "\(parts.year)", stage: WatchStickers.yearStage(month: month), accent: accent)
        ZStack {
          WatchGaugeRing(progress: parts.progress, colors: [Color(hex: "#38BDF8"), accent, secondary, Color(hex: "#F0ABFC")], lineWidth: 12)
            .frame(width: 148, height: 148)
          VStack(spacing: 0) {
            WatchHero(value: "\(parts.daysLeft)", size: 42, glow: accent)
            watchCaption(parts.daysLeft == 1 ? "day left" : "days left")
          }
        }
      }
      .accessibilityElement(children: .ignore)
      .accessibilityLabel("\(parts.year). Day \(parts.day) of \(parts.daysInYear). \(parts.daysLeft) days left.")
    }
  }
}

// MARK: - Life

struct WatchLifePage: View {
  let now: Date
  let profile: WatchProfile?

  var body: some View {
    let (accent, secondary) = WatchTheme.accents(.life)
    WatchPage(accent: accent, secondary: secondary) {
      if let parts = WatchPeriodMath.life(profile: profile, now: now) {
        VStack(alignment: .leading, spacing: 10) {
          WatchPageHeader(kind: .life, title: "Your life", stage: WatchStickers.lifeStage(progress: parts.progress), accent: accent)
          WatchHero(value: watchOneDecimal(parts.yearsLeft), unit: "years left", size: 42, glow: accent)
          WatchSegmentBar(fractions: decades(parts), colors: [secondary, accent], height: 12)
            .accessibilityHidden(true)
          watchCaption("of \(parts.deathAge) years")
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Your life. \(watchOneDecimal(parts.yearsLeft)) years left of \(parts.deathAge).")
      } else {
        VStack(spacing: 10) {
          HStack {
            WatchOverline(text: "Your life", color: accent)
            Spacer(minLength: 0)
          }
          WatchEmptyState(emoji: "❤️", message: "Add your birth date in UNTIL on iPhone", accent: accent)
        }
      }
    }
  }

  /// One block per decade, each filled by the years lived inside it.
  private func decades(_ parts: WatchLifeParts) -> [Double] {
    let count = max(1, Int((Double(parts.deathAge) / 10).rounded(.up)))
    return (0..<count).map { index in
      min(1, max(0, (parts.yearsLived - Double(index) * 10) / 10))
    }
  }
}
