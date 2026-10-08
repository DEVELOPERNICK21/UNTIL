import Combine
import SwiftUI

struct TimeHubView: View {
  @EnvironmentObject private var session: WatchSessionReceiver
  @Environment(\.scenePhase) private var scenePhase
  @State private var now = Date()
  @State private var page: WatchPageKind = TimeHubView.firstPage

  /// Once a minute is enough: every number on these pages changes by the minute at most, and
  /// the running timer counts up by itself.
  private let minute = Timer.publish(every: 30, on: .main, in: .common).autoconnect()

  var body: some View {
    TabView(selection: $page) {
      WatchTodayPage(now: now).tag(WatchPageKind.today)
      WatchMonthPage(now: now).tag(WatchPageKind.month)
      WatchYearPage(now: now).tag(WatchPageKind.year)
      WatchLifePage(now: now, profile: session.profile).tag(WatchPageKind.life)
      WatchStreakPage(now: now, streak: session.extras.streak).tag(WatchPageKind.streak)
      WatchTasksPage(tasks: session.extras.tasks).tag(WatchPageKind.tasks)
      WatchCounterPage(counter: session.extras.counter) { change in
        guard let id = session.extras.counter?.id else { return }
        WatchTheme.play(change > 0 ? .success : .click)
        session.counter(id: id, change: change)
      }.tag(WatchPageKind.counter)
      WatchTimerPage(
        now: now,
        timer: session.extras.timer ?? .idle,
        notice: session.notice,
        onToggle: {
          WatchTheme.play((session.extras.timer?.isRunning ?? false) ? .stop : .start)
          session.timer("toggle")
        },
        onReset: {
          WatchTheme.play(.click)
          session.timer("reset")
        }
      ).tag(WatchPageKind.timer)
    }
    .tabViewStyle(.page)
    .modifier(DebugTextSize())
    .onReceive(minute) { now = $0 }
    .onChange(of: scenePhase) { _, phase in
      if phase == .active { now = Date() }
    }
    .onAppear { runDebugAction() }
  }

  /// In debug builds `-untilWatchAction timer.toggle` (or `timer.reset`, `counter.up`, `counter.down`)
  /// sends the same message as the button, a few seconds after launch. For testing the phone link.
  private func runDebugAction() {
    #if DEBUG
    let args = ProcessInfo.processInfo.arguments
    guard let index = args.firstIndex(of: "-untilWatchAction"), args.indices.contains(index + 1) else { return }
    let action = args[index + 1]
    DispatchQueue.main.asyncAfter(deadline: .now() + 6) {
      switch action {
      case "timer.toggle": session.timer("toggle")
      case "timer.reset": session.timer("reset")
      case "counter.up": if let id = session.extras.counter?.id { session.counter(id: id, change: 1) }
      case "counter.down": if let id = session.extras.counter?.id { session.counter(id: id, change: -1) }
      default: break
      }
    }
    #endif
  }

  /// In debug builds `-untilWatchPage streak` opens on that page, for screenshots.
  private static var firstPage: WatchPageKind {
    #if DEBUG
    let args = ProcessInfo.processInfo.arguments
    if let index = args.firstIndex(of: "-untilWatchPage"), args.indices.contains(index + 1),
       let kind = WatchPageKind(rawValue: args[index + 1]) {
      return kind
    }
    #endif
    return .today
  }
}

/// In debug builds `-untilWatchTextSize 3` forces accessibility text size 3 (1 to 5), for checking
/// that nothing clips. The watch simulator has no text size setting.
private struct DebugTextSize: ViewModifier {
  func body(content: Content) -> some View {
    #if DEBUG
    let args = ProcessInfo.processInfo.arguments
    if let index = args.firstIndex(of: "-untilWatchTextSize"), args.indices.contains(index + 1),
       let level = Int(args[index + 1]) {
      let sizes: [DynamicTypeSize] = [.accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5]
      content.dynamicTypeSize(sizes[max(0, min(sizes.count - 1, level - 1))])
    } else {
      content
    }
    #else
    content
    #endif
  }
}
