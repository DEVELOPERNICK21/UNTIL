//
//  DayDetailView.swift
//  UNTILWatch
//

import SwiftUI

struct DayDetailView: View {
  @EnvironmentObject private var session: WatchSessionReceiver
  @Environment(\.dynamicTypeSize) private var dynamicTypeSize

  /// Scales with System Settings text size (Dynamic Type).
  @ScaledMetric(relativeTo: .largeTitle) private var percentFontSize: CGFloat = 40
  @ScaledMetric(relativeTo: .body) private var barHeight: CGFloat = 8

  private var passed: Color { Color(hex: DayWatchDesign.passed) }
  private var left: Color { Color(hex: DayWatchDesign.left) }
  private var percent: Color { Color(hex: DayWatchDesign.percent) }
  private var label: Color { Color(hex: DayWatchDesign.label) }
  private var text: Color { Color(hex: DayWatchDesign.text) }

  private var isAccessibilitySize: Bool {
    dynamicTypeSize.isAccessibilitySize
  }

  var body: some View {
    Group {
      if let cache = session.cache {
        ScrollView {
          VStack(spacing: isAccessibilitySize ? 14 : 10) {
            Text("TODAY")
              .font(.caption.weight(.medium))
              .foregroundColor(label)
              .tracking(1)
              .multilineTextAlignment(.center)
              .frame(maxWidth: .infinity)

            Text("\(cache.dayPercentDone)%")
              .font(.system(size: percentFontSize, weight: .bold))
              .foregroundColor(percent)
              .minimumScaleFactor(0.5)
              .lineLimit(1)
              .multilineTextAlignment(.center)
              .frame(maxWidth: .infinity)

            GeometryReader { geo in
              ZStack(alignment: .leading) {
                Capsule().fill(passed)
                Capsule()
                  .fill(left)
                  .frame(width: max(0, geo.size.width * cache.progressClamped))
              }
            }
            .frame(height: barHeight)
            .padding(.horizontal, 4)
            .accessibilityHidden(true)

            Text(cache.timeLeftText())
              .font(.body.weight(.semibold))
              .foregroundColor(text)
              .multilineTextAlignment(.center)
              .fixedSize(horizontal: false, vertical: true)
              .frame(maxWidth: .infinity)

            Text("Synced from iPhone")
              .font(.caption2)
              .foregroundColor(label)
              .multilineTextAlignment(.center)
              .fixedSize(horizontal: false, vertical: true)
              .frame(maxWidth: .infinity)
              .padding(.top, 4)
          }
          .padding(.horizontal, 12)
          .padding(.vertical, 8)
          .frame(maxWidth: .infinity)
        }
      } else {
        ScrollView {
          Text("Open UNTIL on iPhone to sync")
            .font(.body.weight(.medium))
            .foregroundColor(label)
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity)
            .padding(16)
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color(hex: DayWatchDesign.background).ignoresSafeArea())
  }
}
