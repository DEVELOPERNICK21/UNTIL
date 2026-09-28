import SwiftUI

struct WatchProgressRing: View {
  let progress: Double
  var lineWidth: CGFloat = 11

  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var displayProgress: Double = 0
  @State private var pulse: Bool = false

  private var clamped: Double { min(1, max(0, progress)) }
  private var fill: Color { Color(hex: WatchProgressColor.hex(for: clamped)) }
  private var track: Color { Color(hex: DayWatchDesign.track) }

  var body: some View {
    GeometryReader { geo in
      let side = min(geo.size.width, geo.size.height)
      let tipSize = max(6, lineWidth * 0.95)
      ZStack {
        Circle()
          .strokeBorder(track, lineWidth: lineWidth)

        Circle()
          .inset(by: lineWidth / 2)
          .trim(from: 0, to: displayProgress)
          .stroke(fill, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
          .rotationEffect(.degrees(-90))

        if displayProgress > 0.001 {
          // Soft glow behind tip
          Circle()
            .fill(fill.opacity(pulse && !reduceMotion ? 0.55 : 0.35))
            .blur(radius: tipSize * 0.5)
            .frame(width: tipSize * 2.2, height: tipSize * 2.2)
            .scaleEffect(pulse && !reduceMotion ? 1.15 : 1.0)
            .animation(
              reduceMotion ? nil : .easeInOut(duration: 1.2).repeatForever(autoreverses: true),
              value: pulse
            )
            .offset(y: -(side / 2) + lineWidth / 2)
            .rotationEffect(.degrees(360 * displayProgress))

          // Tip
          Circle()
            .fill(fill)
            .frame(width: tipSize, height: tipSize)
            .offset(y: -(side / 2) + lineWidth / 2)
            .rotationEffect(.degrees(360 * displayProgress))
        }
      }
      .frame(width: side, height: side)
      .position(x: geo.size.width / 2, y: geo.size.height / 2)
    }
    .aspectRatio(1, contentMode: .fit)
    .accessibilityHidden(true)
    .onAppear {
      restartFillAnimation()
    }
    .onChange(of: progress) { _, newValue in
      let p = min(1, max(0, newValue))
      if reduceMotion {
        displayProgress = p
      } else {
        withAnimation(.easeOut(duration: 0.45)) {
          displayProgress = p
        }
      }
    }
  }

  private func restartFillAnimation() {
    if reduceMotion {
      displayProgress = clamped
    } else {
      displayProgress = 0
      withAnimation(.easeOut(duration: 0.45)) {
        displayProgress = clamped
      }
    }
    pulse = !reduceMotion
  }
}
