//
//  WatchGauges.swift
//  The drawings behind each page: sky arc, ring, calendar dots, donut and segment bar.
//  Everything here is drawn from values once; nothing animates on its own, which keeps the
//  watch's battery and the always-on display happy.
//

import SwiftUI

// MARK: - Sky arc (Today)

/// A hill the day climbs and descends. Sun at one end, moon at the other, a glowing sticker
/// marking where the day is now.
struct WatchSkyArc: View {
  let progress: Double
  let accent: Color

  @Environment(\.isLuminanceReduced) private var dimmed
  private let line: CGFloat = 8

  private func arc(in size: CGSize) -> Path {
    let start = CGPoint(x: 14, y: size.height - 12)
    let end = CGPoint(x: size.width - 14, y: size.height - 12)
    // Control point chosen so the top of the hill sits near the top edge.
    let apex = CGFloat(10)
    let control = CGPoint(x: size.width / 2, y: 2 * apex - (size.height - 12))
    var path = Path()
    path.move(to: start)
    path.addQuadCurve(to: end, control: control)
    return path
  }

  var body: some View {
    GeometryReader { geo in
      let path = arc(in: geo.size)
      let share = min(1, max(0, progress))
      let head = path.trimmedPath(from: 0, to: max(0.001, share)).currentPoint ?? .zero
      ZStack {
        path.stroke(WatchTheme.track, style: StrokeStyle(lineWidth: line, lineCap: .round))
        path
          .trim(from: 0, to: share)
          .stroke(
            LinearGradient(
              colors: [Color(hex: "#4F46E5"), Color(hex: "#7C3AED"), Color(hex: "#FB7185"), Color(hex: "#FBBF24"), Color(hex: "#F97316")],
              startPoint: .leading,
              endPoint: .trailing
            ),
            style: StrokeStyle(lineWidth: line, lineCap: .round)
          )
          .shadow(color: dimmed ? .clear : accent.opacity(0.7), radius: 6)

        Image(systemName: "sun.max.fill")
          .font(.system(size: 11, weight: .bold))
          .foregroundColor(Color(hex: "#FBBF24"))
          .position(x: 14, y: geo.size.height - 12)
          .opacity(share < 0.08 ? 0 : 1)
        Image(systemName: "moon.stars.fill")
          .font(.system(size: 11, weight: .bold))
          .foregroundColor(Color(hex: "#C7D2FE"))
          .position(x: geo.size.width - 14, y: geo.size.height - 12)
          .opacity(share > 0.92 ? 0 : 1)

        WatchStickerButton(kind: .today, stage: WatchStickers.todayStage(progress: share), accent: accent, size: 30)
          .position(head)
      }
    }
  }
}

// MARK: - Ring (Year)

/// A 270 degree gauge that opens at the bottom, with a glowing knob at the end of the fill.
struct WatchGaugeRing: View {
  let progress: Double
  let colors: [Color]
  var lineWidth: CGFloat = 12

  @Environment(\.isLuminanceReduced) private var dimmed
  private let sweep = 0.75

  var body: some View {
    GeometryReader { geo in
      let side = min(geo.size.width, geo.size.height)
      let radius = (side - lineWidth) / 2
      let share = min(1, max(0, progress))
      let angle = Angle.degrees(135 + 270 * share).radians
      ZStack {
        Circle()
          .trim(from: 0, to: sweep)
          .stroke(WatchTheme.track, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
          .rotationEffect(.degrees(135))
        Circle()
          .trim(from: 0, to: sweep * share)
          .stroke(
            AngularGradient(colors: colors, center: .center, startAngle: .degrees(0), endAngle: .degrees(270)),
            style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
          )
          .rotationEffect(.degrees(135))
          .shadow(color: dimmed ? .clear : (colors.last ?? .white).opacity(0.6), radius: 6)
        if share > 0.01 {
          WatchKnob(color: colors.last ?? .white, size: lineWidth * 0.85)
            .position(x: geo.size.width / 2 + radius * CGFloat(cos(angle)), y: geo.size.height / 2 + radius * CGFloat(sin(angle)))
        }
      }
      .frame(width: geo.size.width, height: geo.size.height)
    }
    .aspectRatio(1, contentMode: .fit)
  }
}

// MARK: - Calendar dots (Month)

/// Days of the month laid out like a calendar. Past days are violet, today glows, days ahead are faint.
struct WatchMonthGrid: View {
  let day: Int
  let daysInMonth: Int
  let leadingBlanks: Int
  let accent: Color

  @Environment(\.isLuminanceReduced) private var dimmed

  var body: some View {
    GeometryReader { geo in
      let cols = 7
      let rows = max(1, Int(ceil(Double(leadingBlanks + daysInMonth) / Double(cols))))
      let gap: CGFloat = 4
      let cell = max(3, min((geo.size.width - gap * CGFloat(cols - 1)) / CGFloat(cols), (geo.size.height - gap * CGFloat(rows - 1)) / CGFloat(rows)))
      VStack(spacing: gap) {
        ForEach(0..<rows, id: \.self) { row in
          HStack(spacing: gap) {
            ForEach(0..<cols, id: \.self) { col in
              dot(number: row * cols + col - leadingBlanks + 1, size: cell)
            }
          }
        }
      }
      .frame(width: geo.size.width, height: geo.size.height)
    }
  }

  @ViewBuilder
  private func dot(number: Int, size: CGFloat) -> some View {
    if number < 1 || number > daysInMonth {
      Color.clear.frame(width: size, height: size)
    } else if number < day {
      Circle().fill(WatchTheme.violet.opacity(0.7)).frame(width: size, height: size)
    } else if number == day {
      Circle()
        .fill(accent)
        .frame(width: size, height: size)
        .shadow(color: dimmed ? .clear : accent.opacity(0.9), radius: 4)
    } else {
      Circle().fill(Color.white.opacity(0.16)).frame(width: size, height: size)
    }
  }
}

// MARK: - Donut (Tasks)

struct WatchDonut: View {
  let progress: Double
  let colors: [Color]
  var lineWidth: CGFloat = 11

  @Environment(\.isLuminanceReduced) private var dimmed

  var body: some View {
    let share = min(1, max(0, progress))
    ZStack {
      Circle().stroke(WatchTheme.track, lineWidth: lineWidth)
      Circle()
        .trim(from: 0, to: share)
        .stroke(
          AngularGradient(colors: colors, center: .center, startAngle: .degrees(0), endAngle: .degrees(360 * max(0.05, share))),
          style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
        )
        .rotationEffect(.degrees(-90))
        .shadow(color: dimmed ? .clear : (colors.last ?? .white).opacity(0.55), radius: 5)
    }
    .padding(lineWidth / 2)
  }
}

// MARK: - Segment bar (Life, Timer)

/// A row of rounded blocks, each filled to its own share.
struct WatchSegmentBar: View {
  let fractions: [Double]
  let colors: [Color]
  var height: CGFloat = 10

  @Environment(\.isLuminanceReduced) private var dimmed

  var body: some View {
    HStack(spacing: 3) {
      ForEach(fractions.indices, id: \.self) { index in
        let share = CGFloat(min(1, max(0, fractions[index])))
        GeometryReader { geo in
          ZStack(alignment: .leading) {
            Capsule().fill(WatchTheme.track)
            if share > 0 {
              Capsule()
                .fill(LinearGradient(colors: colors, startPoint: .leading, endPoint: .trailing))
                .frame(width: max(height, geo.size.width * share))
                .shadow(color: dimmed ? .clear : (colors.last ?? .white).opacity(0.5), radius: 4)
            }
          }
        }
      }
    }
    .frame(height: height)
  }
}
