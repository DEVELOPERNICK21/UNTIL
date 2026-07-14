//
//  DayDetailView.swift
//  UNTILWatch
//

import SwiftUI

struct DayDetailView: View {
  @EnvironmentObject private var session: WatchSessionReceiver

  private var passed: Color { Color(hex: DayWatchDesign.passed) }
  private var left: Color { Color(hex: DayWatchDesign.left) }
  private var percent: Color { Color(hex: DayWatchDesign.percent) }
  private var label: Color { Color(hex: DayWatchDesign.label) }
  private var text: Color { Color(hex: DayWatchDesign.text) }

  var body: some View {
    Group {
      if let cache = session.cache {
        VStack(spacing: 10) {
          Text("TODAY")
            .font(.system(size: 11, weight: .medium))
            .foregroundColor(label)
            .tracking(1)

          Text("\(cache.dayPercentDone)%")
            .font(.system(size: 40, weight: .bold))
            .foregroundColor(percent)

          GeometryReader { geo in
            ZStack(alignment: .leading) {
              Capsule().fill(passed)
              Capsule()
                .fill(left)
                .frame(width: max(0, geo.size.width * cache.progressClamped))
            }
          }
          .frame(height: 8)
          .padding(.horizontal, 8)

          Text(cache.timeLeftText())
            .font(.system(size: 14, weight: .semibold))
            .foregroundColor(text)

          Spacer(minLength: 0)

          Text("Synced from iPhone")
            .font(.system(size: 10))
            .foregroundColor(label)
        }
        .padding(12)
      } else {
        VStack(spacing: 8) {
          Text("Open UNTIL on iPhone to sync")
            .font(.system(size: 13, weight: .medium))
            .foregroundColor(label)
            .multilineTextAlignment(.center)
        }
        .padding(16)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color(hex: DayWatchDesign.background).ignoresSafeArea())
  }
}
