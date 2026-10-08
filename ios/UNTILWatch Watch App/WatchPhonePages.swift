//
//  WatchPhonePages.swift
//  Streak, Tasks and the Hour timer. Their numbers come from the phone.
//

import SwiftUI

// MARK: - Streak

struct WatchStreakPage: View {
  let now: Date
  let streak: WatchStreak?

  var body: some View {
    let (accent, secondary) = WatchTheme.accents(.streak)
    WatchPage(accent: accent, secondary: secondary) {
      if let streak = streak?.aligned(now: now) {
        VStack(alignment: .leading, spacing: 8) {
          HStack {
            WatchOverline(text: "Streak", color: accent)
            Spacer(minLength: 0)
          }
          HStack(alignment: .center, spacing: 8) {
            WatchStickerButton(kind: .streak, stage: WatchStickers.streakStage(count: streak.count), accent: accent, size: 40)
            WatchHero(value: "\(streak.count)", unit: streak.count == 1 ? "day" : "days", size: 40, glow: accent)
          }
          Rectangle().fill(Color.white.opacity(0.10)).frame(height: 1)
          WeekDots(streak: streak, now: now, accent: accent, secondary: secondary)
          watchCaption(streak.noticedToday ? "You showed up today" : "Open UNTIL to keep it going")
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Streak. \(streak.count) days. \(streak.noticedToday ? "You showed up today." : "Not yet today.")")
      } else {
        VStack(spacing: 10) {
          HStack {
            WatchOverline(text: "Streak", color: accent)
            Spacer(minLength: 0)
          }
          WatchEmptyState(emoji: "🔥", message: "Open UNTIL on iPhone to sync your streak", accent: accent)
        }
      }
    }
  }
}

private struct WeekDots: View {
  let streak: WatchStreak
  let now: Date
  let accent: Color
  let secondary: Color

  @Environment(\.isLuminanceReduced) private var dimmed

  var body: some View {
    let letters = streak.weekdayInitials(now: now)
    HStack(spacing: 0) {
      ForEach(streak.dots.indices, id: \.self) { index in
        let isToday = index == streak.dots.count - 1
        VStack(spacing: 4) {
          dot(done: streak.dots[index], isToday: isToday)
          Text(letters.indices.contains(index) ? letters[index] : "")
            .watchFont(10, isToday ? .bold : .medium, relativeTo: .caption2)
            .foregroundColor(isToday ? WatchTheme.text : WatchTheme.label)
        }
        .frame(maxWidth: .infinity)
      }
    }
    .accessibilityHidden(true)
  }

  @ViewBuilder
  private func dot(done: Bool, isToday: Bool) -> some View {
    ZStack {
      if done {
        Circle()
          .fill(LinearGradient(colors: [accent, secondary], startPoint: .top, endPoint: .bottom))
          .shadow(color: dimmed ? .clear : accent.opacity(0.7), radius: 4)
        Image(systemName: "checkmark")
          .font(.system(size: 9, weight: .heavy))
          .foregroundColor(Color.black.opacity(0.75))
      } else if isToday {
        Circle().strokeBorder(accent.opacity(0.8), style: StrokeStyle(lineWidth: 1.6, dash: [3, 2.5]))
      } else {
        Circle().fill(Color.white.opacity(0.10))
      }
    }
    .frame(width: 20, height: 20)
  }
}

// MARK: - Tasks

struct WatchTasksPage: View {
  let tasks: WatchTasks?

  private static let dotColors: [String: String] = [
    "health": "#4ADE80", "work": "#60A5FA", "personal_care": "#F472B6", "learning": "#BB86FC", "other": "#8A8A8E",
  ]

  var body: some View {
    let (accent, secondary) = WatchTheme.accents(.tasks)
    WatchPage(accent: accent, secondary: secondary) {
      if let tasks, tasks.total > 0 {
        VStack(alignment: .leading, spacing: 10) {
          WatchPageHeader(
            kind: .tasks,
            title: "Today's tasks",
            stage: WatchStickers.tasksStage(completed: tasks.completed, total: tasks.total),
            accent: accent
          )
          HStack(spacing: 8) {
            ZStack {
              WatchDonut(progress: tasks.share, colors: [secondary, accent], lineWidth: 9)
              VStack(spacing: -1) {
                WatchHero(value: "\(tasks.completed)/\(tasks.total)", size: 20, glow: accent)
                Text(tasks.allDone ? "all done" : "done")
                  .watchFont(11, .medium, relativeTo: .caption2)
                  .foregroundColor(WatchTheme.label)
              }
            }
            .frame(width: 78, height: 78)
            VStack(spacing: 5) {
              ForEach(tasks.categories.prefix(4)) { category in
                row(category)
              }
            }
          }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Tasks. \(tasks.completed) of \(tasks.total) done.")
      } else {
        VStack(spacing: 10) {
          HStack {
            WatchOverline(text: "Today's tasks", color: accent)
            Spacer(minLength: 0)
          }
          WatchEmptyState(
            emoji: "📝",
            message: tasks == nil ? "Open UNTIL on iPhone to sync your tasks" : "No tasks yet. Add one in UNTIL.",
            accent: accent
          )
        }
      }
    }
  }

  private func row(_ category: WatchTaskCategory) -> some View {
    let tint = Color(hex: Self.dotColors[category.key] ?? "#8A8A8E")
    return HStack(spacing: 4) {
      if !WatchLayout.isCompact {
        Circle().fill(tint).frame(width: 7, height: 7)
      }
      Text(category.label)
        .watchFont(12, .medium, relativeTo: .caption)
        // Compact screens have no room for the dot, so the name carries the colour.
        .foregroundColor(WatchLayout.isCompact ? tint : WatchTheme.text)
        .lineLimit(1)
        .minimumScaleFactor(0.6)
      Spacer(minLength: 1)
      Text("\(category.completed)/\(category.total)")
        .watchFont(12, .semibold, relativeTo: .caption)
        .monospacedDigit()
        .lineLimit(1)
        .fixedSize()
        .foregroundColor(category.completed >= category.total ? Color(hex: "#4ADE80") : WatchTheme.text)
    }
    .padding(.horizontal, 7)
    .padding(.vertical, 6)
    .watchGlass(radius: 12)
  }
}

// MARK: - Counter

struct WatchCounterPage: View {
  let counter: WatchCounter?
  let onChange: (Int) -> Void

  @Environment(\.isLuminanceReduced) private var dimmed

  var body: some View {
    let (accent, secondary) = WatchTheme.accents(.counter)
    WatchPage(accent: accent, secondary: secondary) {
      if let counter {
        VStack(alignment: .leading, spacing: 6) {
          WatchPageHeader(kind: .counter, title: counter.title, stage: WatchStickers.counterStage(count: counter.count), accent: accent)
          WatchHero(value: "\(counter.count)", size: WatchLayout.isCompact ? 42 : 52, glow: accent)
          WatchWave(color: accent)
            .frame(height: WatchLayout.isCompact ? 14 : 22)
            .opacity(dimmed ? 0 : 1)
            .accessibilityHidden(true)
          stepper(accent: accent, canDecrease: counter.count > 0)
        }
        .accessibilityElement(children: .contain)
      } else {
        VStack(spacing: 10) {
          HStack {
            WatchOverline(text: "Counter", color: accent)
            Spacer(minLength: 0)
          }
          WatchEmptyState(emoji: "💧", message: "Add a counter in UNTIL on iPhone", accent: accent)
        }
      }
    }
  }

  /// Minus and plus in one glass pill.
  private func stepper(accent: Color, canDecrease: Bool) -> some View {
    HStack(spacing: 0) {
      Button { onChange(-1) } label: {
        Image(systemName: "minus")
          .font(.system(size: 20, weight: .bold))
          .foregroundColor(canDecrease ? .white : WatchTheme.label.opacity(0.5))
          .frame(maxWidth: .infinity, minHeight: WatchLayout.isCompact ? 40 : 46)
          .contentShape(Rectangle())
      }
      .buttonStyle(WatchPressStyle())
      .disabled(!canDecrease)
      .accessibilityLabel("Take one off")

      Rectangle().fill(Color.white.opacity(0.18)).frame(width: 1, height: 24)

      Button { onChange(1) } label: {
        Image(systemName: "plus")
          .font(.system(size: 22, weight: .bold))
          .foregroundColor(accent)
          .frame(maxWidth: .infinity, minHeight: WatchLayout.isCompact ? 40 : 46)
          .contentShape(Rectangle())
      }
      .buttonStyle(WatchPressStyle())
      .accessibilityLabel("Add one")
    }
    .background(Capsule().fill(Color.black.opacity(0.55)))
    .overlay(Capsule().strokeBorder(Color.white.opacity(0.12), lineWidth: 1))
    .shadow(color: dimmed ? .clear : accent.opacity(0.35), radius: 8)
  }
}

/// Two soft waves. Drawn once, still.
struct WatchWave: View {
  let color: Color

  var body: some View {
    GeometryReader { geo in
      ZStack {
        wave(in: geo.size, phase: 0, amplitude: 0.30).stroke(color.opacity(0.7), lineWidth: 1.5)
        wave(in: geo.size, phase: 1.6, amplitude: 0.22).stroke(color.opacity(0.35), lineWidth: 1.5)
      }
    }
  }

  private func wave(in size: CGSize, phase: Double, amplitude: Double) -> Path {
    var path = Path()
    let mid = size.height / 2
    let amp = size.height * amplitude
    path.move(to: CGPoint(x: 0, y: mid))
    var x: CGFloat = 0
    while x <= size.width {
      let t = Double(x / size.width) * 2 * Double.pi * 1.5 + phase
      path.addLine(to: CGPoint(x: x, y: mid + CGFloat(sin(t)) * amp))
      x += 2
    }
    return path
  }
}

// MARK: - Hour timer

struct WatchTimerPage: View {
  let now: Date
  let timer: WatchTimer
  let notice: String?
  let onToggle: () -> Void
  let onReset: () -> Void

  @Environment(\.isLuminanceReduced) private var dimmed

  var body: some View {
    let (accent, secondary) = WatchTheme.accents(.timer)
    let minutes = timer.totalMs(now: now) / 60_000
    WatchPage(accent: accent, secondary: secondary) {
      VStack(alignment: .leading, spacing: 8) {
        WatchPageHeader(kind: .timer, title: timer.title, stage: WatchStickers.timerStage(minutes: minutes), accent: accent)

        clock(accent: accent)

        WatchSegmentBar(
          fractions: [timer.hourFraction(now: now)],
          colors: [secondary, accent],
          height: 8
        )
        .accessibilityHidden(true)

        HStack(spacing: 14) {
          Spacer(minLength: 0)
          playButton(accent: accent)
          resetButton
          Spacer(minLength: 0)
        }
        .padding(.top, 2)

        if let notice {
          watchCaption(notice)
        }
      }
    }
  }

  /// A running timer counts up by itself, so the page does not have to redraw every second.
  @ViewBuilder
  private func clock(accent: Color) -> some View {
    Group {
      if timer.isRunning {
        Text(timer.origin(now: now), style: .timer)
      } else {
        Text(timer.text(now: now))
      }
    }
    .watchFont(WatchLayout.isCompact ? 36 : 42, .semibold, relativeTo: .largeTitle)
    .monospacedDigit()
    .foregroundColor(WatchTheme.text)
    .lineLimit(1)
    .minimumScaleFactor(0.5)
    .shadow(color: dimmed ? .clear : accent.opacity(0.55), radius: 8)
    .frame(maxWidth: .infinity, alignment: .leading)
    .accessibilityLabel("Hour timer \(timer.text(now: now)). \(timer.isRunning ? "Running" : "Paused")")
  }

  private func playButton(accent: Color) -> some View {
    Button(action: onToggle) {
      ZStack {
        Circle().fill(accent.opacity(0.20))
        Circle().strokeBorder(accent, lineWidth: 3)
        Image(systemName: timer.isRunning ? "pause.fill" : "play.fill")
          .font(.system(size: 20, weight: .bold))
          .foregroundColor(.white)
      }
      .frame(width: WatchLayout.isCompact ? 48 : 56, height: WatchLayout.isCompact ? 48 : 56)
      .shadow(color: dimmed ? .clear : accent.opacity(0.6), radius: 7)
    }
    .buttonStyle(WatchPressStyle())
    .accessibilityLabel(timer.isRunning ? "Pause hour timer" : "Start hour timer")
  }

  private var resetButton: some View {
    Button(action: onReset) {
      ZStack {
        Circle().fill(WatchTheme.glass)
        Image(systemName: "arrow.counterclockwise")
          .font(.system(size: 15, weight: .bold))
          .foregroundColor(.white)
      }
      .frame(width: WatchLayout.isCompact ? 38 : 44, height: WatchLayout.isCompact ? 38 : 44)
    }
    .buttonStyle(WatchPressStyle())
    .accessibilityLabel("Reset hour timer")
  }
}

/// Shrinks a little while pressed.
struct WatchPressStyle: ButtonStyle {
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .scaleEffect(configuration.isPressed && !reduceMotion ? 0.92 : 1)
      .animation(reduceMotion ? nil : .spring(response: 0.25, dampingFraction: 0.6), value: configuration.isPressed)
  }
}
