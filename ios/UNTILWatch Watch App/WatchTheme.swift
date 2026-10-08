//
//  WatchTheme.swift
//  Colours, backgrounds and the small pieces every watch page is built from.
//

import SwiftUI
#if os(watchOS)
import WatchKit
#endif

enum WatchLayout {
  /// Screens up to about 42 mm. Pages use smaller controls and drop small decoration there.
  static var isCompact: Bool {
    #if os(watchOS)
    return WKInterfaceDevice.current().screenBounds.width < 195
    #else
    return false
    #endif
  }
}

enum WatchTheme {
  static let label = Color(hex: "#9A9A9A")
  static let text = Color(hex: "#F2F2F2")
  static let ember = Color(hex: "#E87C20")
  static let violet = Color(hex: "#BB86FC")
  static let track = Color.white.opacity(0.13)
  static let glass = Color.white.opacity(0.09)

  /// Main and second colour of each page. They tint the background and the glow.
  static func accents(_ kind: WatchPageKind, progress: Double = 0) -> (Color, Color) {
    switch kind {
    case .today:
      let sky: [String] = ["#818CF8", "#FB7185", "#FBBF24", "#F59E0B", "#F97316", "#818CF8"]
      return (Color(hex: sky[WatchStickers.todayStage(progress: progress)]), Color(hex: "#A78BFA"))
    case .month: return (Color(hex: "#2ED3C6"), Color(hex: "#60A5FA"))
    case .year: return (Color(hex: "#60A5FA"), Color(hex: "#A78BFA"))
    case .life: return (Color(hex: "#FB7185"), Color(hex: "#F59E0B"))
    case .streak: return (Color(hex: "#F97316"), Color(hex: "#FBBF24"))
    case .tasks: return (Color(hex: "#4ADE80"), Color(hex: "#2ED3C6"))
    case .counter: return (Color(hex: "#38BDF8"), Color(hex: "#2DD4BF"))
    case .timer: return (Color(hex: "#BB86FC"), Color(hex: "#22D3EE"))
    }
  }

  static func play(_ type: PlayType = .click) {
    #if os(watchOS)
    switch type {
    case .click: WKInterfaceDevice.current().play(.click)
    case .success: WKInterfaceDevice.current().play(.success)
    case .start: WKInterfaceDevice.current().play(.start)
    case .stop: WKInterfaceDevice.current().play(.stop)
    }
    #endif
  }

  enum PlayType { case click, success, start, stop }
}

/// A rounded system font that grows with the watch's text size setting.
struct WatchScaledFont: ViewModifier {
  @ScaledMetric private var size: CGFloat
  private let weight: Font.Weight

  init(_ size: CGFloat, _ weight: Font.Weight, relativeTo style: Font.TextStyle) {
    _size = ScaledMetric(wrappedValue: size, relativeTo: style)
    self.weight = weight
  }

  func body(content: Content) -> some View {
    content.font(.system(size: size, weight: weight, design: .rounded))
  }
}

extension View {
  func watchFont(_ size: CGFloat, _ weight: Font.Weight = .regular, relativeTo style: Font.TextStyle = .body) -> some View {
    modifier(WatchScaledFont(size, weight, relativeTo: style))
  }
}

/// Black with a soft wash of the page's colour. The wash fades when the watch dims.
struct WatchPageBackground: View {
  let accent: Color
  let secondary: Color
  @Environment(\.isLuminanceReduced) private var dimmed

  var body: some View {
    ZStack {
      Color.black
      if !dimmed {
        RadialGradient(colors: [accent.opacity(0.30), .clear], center: .top, startRadius: 0, endRadius: 200)
        RadialGradient(colors: [secondary.opacity(0.26), .clear], center: .bottom, startRadius: 0, endRadius: 170)
      }
    }
    .ignoresSafeArea()
  }
}

/// Small capitalised title.
struct WatchOverline: View {
  let text: String
  var color: Color = WatchTheme.label

  var body: some View {
    Text(text.uppercased())
      .watchFont(11, .semibold, relativeTo: .caption2)
      .tracking(1.1)
      .foregroundColor(color)
      .lineLimit(1)
      .minimumScaleFactor(0.7)
  }
}

/// The big number, with an optional small unit beside it.
struct WatchHero: View {
  let value: String
  var unit: String?
  var size: CGFloat = 38
  var color: Color = WatchTheme.text
  var glow: Color?

  @Environment(\.isLuminanceReduced) private var dimmed

  var body: some View {
    HStack(alignment: .lastTextBaseline, spacing: 4) {
      Text(value)
        .watchFont(size, .semibold, relativeTo: .largeTitle)
        .monospacedDigit()
        .foregroundColor(color)
        .lineLimit(1)
        .minimumScaleFactor(0.5)
        .contentTransition(.numericText())
      if let unit {
        Text(unit)
          .watchFont(max(12, size * 0.34), .medium, relativeTo: .body)
          .foregroundColor(WatchTheme.label)
          .lineLimit(1)
          .minimumScaleFactor(0.6)
      }
    }
    .shadow(color: dimmed ? .clear : (glow ?? .clear).opacity(0.55), radius: 8)
  }
}

/// Emoji on a soft glow. Tap it to change the sticker pack.
struct WatchSticker: View {
  let emoji: String
  let accent: Color
  var size: CGFloat = 28
  var glows = true

  @Environment(\.isLuminanceReduced) private var dimmed

  var body: some View {
    ZStack {
      if glows && !dimmed {
        Circle()
          .fill(RadialGradient(colors: [accent.opacity(0.55), accent.opacity(0)], center: .center, startRadius: 0, endRadius: size * 0.95))
          .frame(width: size * 1.9, height: size * 1.9)
      }
      Circle()
        .fill(accent.opacity(0.18))
        .overlay(Circle().strokeBorder(accent.opacity(0.65), lineWidth: 1))
        .frame(width: size, height: size)
      Text(emoji)
        .font(.system(size: size * 0.56))
        .id(emoji)
        .transition(.scale(scale: 0.4).combined(with: .opacity))
    }
    .frame(width: size, height: size)
    .accessibilityHidden(true)
  }
}

/// A sticker that moves to the next pack when tapped. The pack is remembered on the watch.
struct WatchStickerButton: View {
  let kind: WatchPageKind
  let stage: Int
  let accent: Color
  var size: CGFloat = 28

  @AppStorage("until.watch.stickerPack") private var pack = 0
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  var body: some View {
    Button {
      WatchTheme.play(.click)
      if reduceMotion {
        pack = WatchStickers.nextPack(pack)
      } else {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) { pack = WatchStickers.nextPack(pack) }
      }
    } label: {
      WatchSticker(emoji: WatchStickers.emoji(kind, pack: pack, stage: stage), accent: accent, size: size)
    }
    .buttonStyle(.plain)
    .accessibilityLabel("Change sticker")
  }
}

/// Header row used by most pages: sticker and title.
struct WatchPageHeader: View {
  let kind: WatchPageKind
  let title: String
  let stage: Int
  let accent: Color

  var body: some View {
    HStack(spacing: 6) {
      WatchStickerButton(kind: kind, stage: stage, accent: accent, size: 26)
      WatchOverline(text: title, color: accent)
      Spacer(minLength: 0)
    }
  }
}

/// A glowing dot that rides the end of an arc or ring.
struct WatchKnob: View {
  let color: Color
  var size: CGFloat = 12

  @Environment(\.isLuminanceReduced) private var dimmed

  var body: some View {
    ZStack {
      if !dimmed {
        Circle().fill(color.opacity(0.45)).frame(width: size * 2.4, height: size * 2.4).blur(radius: size * 0.5)
      }
      Circle().fill(Color.white).frame(width: size, height: size)
      Circle().fill(color).frame(width: size * 0.6, height: size * 0.6)
    }
  }
}

/// Dark glass panel used for list rows and notices.
struct WatchGlass: ViewModifier {
  var radius: CGFloat = 16

  func body(content: Content) -> some View {
    content
      .background(RoundedRectangle(cornerRadius: radius, style: .continuous).fill(WatchTheme.glass))
      .overlay(RoundedRectangle(cornerRadius: radius, style: .continuous).strokeBorder(Color.white.opacity(0.08), lineWidth: 1))
  }
}

extension View {
  func watchGlass(radius: CGFloat = 16) -> some View { modifier(WatchGlass(radius: radius)) }
}

/// Shown when the phone has not sent something yet.
struct WatchEmptyState: View {
  let emoji: String
  let message: String
  let accent: Color

  var body: some View {
    VStack(spacing: 10) {
      WatchSticker(emoji: emoji, accent: accent, size: 40)
      Text(message)
        .watchFont(14, .medium, relativeTo: .body)
        .foregroundColor(WatchTheme.text)
        .multilineTextAlignment(.center)
        .fixedSize(horizontal: false, vertical: true)
    }
    .padding(14)
    .frame(maxWidth: .infinity)
    .watchGlass(radius: 20)
  }
}
