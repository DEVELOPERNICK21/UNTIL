import SwiftUI

struct TimePeriodPageView: View {
  let title: String
  let snapshot: PeriodSnapshot?
  let emptyText: String?
  let footer: String?

  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  @ScaledMetric(relativeTo: .largeTitle) private var percentFontSize: CGFloat = 40
  @ScaledMetric(relativeTo: .body) private var barHeight: CGFloat = 8

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
            .foregroundColor(Color(hex: DayWatchDesign.percent))
            .minimumScaleFactor(0.5)
            .lineLimit(1)
            .frame(maxWidth: .infinity)

          GeometryReader { geo in
            ZStack(alignment: .leading) {
              Capsule().fill(Color(hex: DayWatchDesign.passed))
              Capsule()
                .fill(Color(hex: DayWatchDesign.left))
                .frame(width: max(0, geo.size.width * snapshot.progressClamped))
            }
          }
          .frame(height: barHeight)
          .padding(.horizontal, 4)
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
}
