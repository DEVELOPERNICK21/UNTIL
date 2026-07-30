import SwiftUI

struct TimeHubView: View {
  @EnvironmentObject private var session: WatchSessionReceiver
  @State private var tick = Date()

  private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

  var body: some View {
    TabView {
      TimePeriodPageView(
        title: "TODAY",
        snapshot: WatchTimeClock.day(now: tick),
        emptyText: nil,
        footer: nil
      )

      TimePeriodPageView(
        title: "THIS MONTH",
        snapshot: WatchTimeClock.month(now: tick),
        emptyText: nil,
        footer: nil
      )

      TimePeriodPageView(
        title: "THIS YEAR",
        snapshot: WatchTimeClock.year(now: tick),
        emptyText: nil,
        footer: nil
      )

      TimePeriodPageView(
        title: "LIFE",
        snapshot: WatchLifeClock.snapshot(profile: session.profile, now: tick),
        emptyText: "Open UNTIL on phone",
        footer: nil
      )
    }
    .tabViewStyle(.page)
    .onReceive(timer) { tick = $0 }
  }
}
