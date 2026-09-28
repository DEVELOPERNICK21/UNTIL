import SwiftUI
#if os(watchOS)
import WatchKit
#endif

/// Detailed hub page: title, %, animated bar with glowing tip, remaining.
/// Restores the previous detailed chrome (not ring-only).
struct TimePeriodPageView: View {
  let title: String
  let snapshot: PeriodSnapshot?
  let emptyText: String?
  let footer: String?

  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @ScaledMetric(relativeTo: .largeTitle) private var percentFontSize: CGFloat = 40
  @ScaledMetric(relativeTo: .body) private var barHeight: CGFloat = 10
  @State private var displayProgress: Double = 0
  @State private var pulse = false
  @State private var bounce = false

  private var isAccessibilitySize: Bool {
    dynamicTypeSize.isAccessibilitySize
  }

  var body: some View {
    ScrollView {
      if let snapshot {
        VStack(spacing: isAccessibilitySize ? 14 : 10) {
          Text(title)
            .font(.caption.weight(.medium))
            .foregroundColor(Color(hex: DayWatchDesign.label))
            .tracking(1)
            .frame(maxWidth: .infinity)

          Text("\(snapshot.percentDone)%")
            .font(.system(size: percentFontSize, weight: .bold))
            .foregroundColor(Color(hex: WatchProgressColor.hex(for: snapshot.progressClamped)))
            .minimumScaleFactor(0.5)
            .lineLimit(1)
            .frame(maxWidth: .infinity)

          InteractiveProgressBar(
            progress: displayProgress,
            colorHex: WatchProgressColor.hex(for: snapshot.progressClamped),
            trackHex: DayWatchDesign.passed,
            barHeight: barHeight,
            pulse: pulse && !reduceMotion
          )
          .padding(.horizontal, 4)
          .scaleEffect(x: 1, y: bounce ? 1.15 : 1)
          .animation(reduceMotion ? nil : .easeInOut(duration: 0.12), value: bounce)
          .contentShape(Rectangle())
          .onTapGesture {
            guard !reduceMotion else { return }
            bounce = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { bounce = false }
            #if os(watchOS)
            WKInterfaceDevice.current().play(.click)
            #endif
          }
          .accessibilityHidden(true)

          Text(snapshot.remainingLabel)
            .font(.body.weight(.semibold))
            .foregroundColor(Color(hex: DayWatchDesign.text))
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity)

          if let footer, !footer.isEmpty {
            Text(footer)
              .font(.caption2)
              .foregroundColor(Color(hex: DayWatchDesign.label))
              .multilineTextAlignment(.center)
              .fixedSize(horizontal: false, vertical: true)
              .frame(maxWidth: .infinity)
              .padding(.top, 4)
          }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .onAppear { restartFill(to: snapshot.progressClamped) }
        .onChange(of: snapshot.progressClamped) { _, newValue in
          if reduceMotion {
            displayProgress = newValue
          } else {
            withAnimation(.easeOut(duration: 0.45)) { displayProgress = newValue }
          }
        }
      } else if let emptyText {
        Text(emptyText)
          .font(.body.weight(.medium))
          .foregroundColor(Color(hex: DayWatchDesign.label))
          .multilineTextAlignment(.center)
          .fixedSize(horizontal: false, vertical: true)
          .padding(16)
          .frame(maxWidth: .infinity)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color(hex: DayWatchDesign.background).ignoresSafeArea())
  }

  private func restartFill(to target: Double) {
    let clamped = min(1, max(0, target))
    if reduceMotion {
      displayProgress = clamped
      pulse = false
      return
    }
    displayProgress = 0
    withAnimation(.easeOut(duration: 0.45)) { displayProgress = clamped }
    pulse = clamped > 0.001
  }
}

private struct InteractiveProgressBar: View {
  let progress: Double
  let colorHex: String
  let trackHex: String
  let barHeight: CGFloat
  let pulse: Bool

  var body: some View {
    GeometryReader { geo in
      let w = max(0, geo.size.width * min(1, max(0, progress)))
      let tip = max(6, barHeight * 0.95)
      ZStack(alignment: .leading) {
        Capsule().fill(Color(hex: trackHex))
        Capsule()
          .fill(Color(hex: colorHex))
          .frame(width: w)

        if progress > 0.001 {
          Circle()
            .fill(Color(hex: colorHex).opacity(pulse ? 0.55 : 0.35))
            .frame(width: tip * 2.1, height: tip * 2.1)
            .scaleEffect(pulse ? 1.15 : 1.0)
            .animation(
              pulse ? .easeInOut(duration: 1.2).repeatForever(autoreverses: true) : nil,
              value: pulse
            )
            .offset(x: max(0, w - tip * 1.05))

          Circle()
            .fill(Color(hex: colorHex))
            .frame(width: tip, height: tip)
            .offset(x: max(0, w - tip * 0.5))
        }
      }
    }
    .frame(height: barHeight)
  }
}
