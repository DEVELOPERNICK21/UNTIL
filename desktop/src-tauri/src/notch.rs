//! The Mac notch island: a black card that grows out of the hardware notch when the pointer rests
//! on it, and folds back when it leaves. Only Macs with a notch get one.
//!
//! The window is as big as the open card and sits above the menu bar. While the card is folded the
//! window ignores the mouse, so menu bar items under it stay clickable. A small thread watches the
//! pointer and tells the page when to open and close.

use std::time::{Duration, Instant};

/// Size of the open card in points. The page draws it, this file hit-tests it.
/// Keep these in step with `--card-w` and `--card-h` in `src/notch.css`.
pub const CARD_W: f64 = 396.0;
pub const CARD_H: f64 = 224.0;
/// Room around the card inside the window, for its shadow.
pub const PAD: f64 = 12.0;
pub const WINDOW_W: f64 = CARD_W + 2.0 * PAD;
pub const WINDOW_H: f64 = CARD_H + PAD;

/// How far the folded notch reaches for the pointer, either side and below.
const HOT_SIDE: f64 = 8.0;
/// Width of each side of the compact island, the strips either side of the notch that show Ember
/// and the countdown. Keep in step with `--ear` in `src/notch.css`.
pub const EAR_W: f64 = 74.0;
/// How far the compact island hangs below the notch, with the day bar in it. Keep in step with
/// `--drop` in `src/notch.css`.
pub const COMPACT_DROP: f64 = 28.0;
const HOT_DROP: f64 = 4.0;
/// The pointer must rest this long before the card opens, so a quick trip to a menu does not.
const OPEN_DWELL: Duration = Duration::from_millis(110);
/// The pointer must stay away this long before the card folds, so a wobble does not close it.
const CLOSE_DWELL: Duration = Duration::from_millis(280);
const CLOSE_MARGIN: f64 = 14.0;

/// A rectangle in Cocoa screen coordinates: points, origin at the bottom left of the primary
/// screen, y grows upward.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Rect {
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
}

impl Rect {
    pub fn contains(&self, p: (f64, f64)) -> bool {
        p.0 >= self.x && p.0 <= self.x + self.w && p.1 >= self.y && p.1 <= self.y + self.h
    }

    fn inflate(&self, by: f64) -> Rect {
        Rect {
            x: self.x - by,
            y: self.y - by,
            w: self.w + 2.0 * by,
            h: self.h + 2.0 * by,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct NotchGeometry {
    /// The whole screen the notch is on.
    pub screen: Rect,
    pub notch_x: f64,
    pub notch_w: f64,
    pub notch_h: f64,
}

impl NotchGeometry {
    /// From what `NSScreen` reports. The notch is the gap between the two menu bar areas that sit
    /// either side of it. A screen without a notch has no top inset and returns `None`.
    pub fn from_screen(
        screen: Rect,
        safe_top: f64,
        left: Rect,
        right: Rect,
    ) -> Option<Self> {
        if safe_top <= 0.0 {
            return None;
        }
        let notch_x = left.x + left.w;
        let notch_w = right.x - notch_x;
        if notch_w <= 0.0 || left.w <= 0.0 || right.w <= 0.0 {
            return None;
        }
        Some(Self {
            screen,
            notch_x,
            notch_w,
            notch_h: safe_top,
        })
    }

    pub fn center_x(&self) -> f64 {
        self.notch_x + self.notch_w / 2.0
    }

    /// Cocoa y of the top edge of the screen.
    pub fn top(&self) -> f64 {
        self.screen.y + self.screen.h
    }

    /// The window: centred on the notch, flush with the top of the screen.
    pub fn window_frame(&self) -> Rect {
        Rect {
            x: self.center_x() - WINDOW_W / 2.0,
            y: self.top() - WINDOW_H,
            w: WINDOW_W,
            h: WINDOW_H,
        }
    }

    /// Where the pointer has to rest to open the card: the folded island, which is wider when the
    /// compact view is on. Reaches a little above the screen edge so a pointer pushed against the
    /// top still counts.
    pub fn hot_rect(&self, compact: bool) -> Rect {
        let side = if compact { EAR_W } else { HOT_SIDE };
        let drop = if compact { COMPACT_DROP } else { HOT_DROP };
        Rect {
            x: self.notch_x - side,
            y: self.top() - self.notch_h - drop,
            w: self.notch_w + 2.0 * side,
            h: self.notch_h + drop + 2.0,
        }
    }

    pub fn card_rect(&self) -> Rect {
        Rect {
            x: self.center_x() - CARD_W / 2.0,
            y: self.top() - CARD_H,
            w: CARD_W,
            h: CARD_H + 2.0,
        }
    }

    /// Where the top-left corner of a panel of this width goes to open under the notch, in
    /// Cocoa coordinates: x, and the y of the panel's top edge.
    pub fn panel_top_left(&self, panel_w: f64) -> (f64, f64) {
        let margin = 8.0;
        let x = (self.center_x() - panel_w / 2.0).clamp(
            self.screen.x + margin,
            (self.screen.x + self.screen.w - panel_w - margin).max(self.screen.x + margin),
        );
        (x, self.top() - self.notch_h - margin)
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum Change {
    Expand,
    Collapse,
}

/// Decides when the card opens and closes from where the pointer is.
#[derive(Default)]
pub struct Hover {
    pub expanded: bool,
    since: Option<Instant>,
}

impl Hover {
    pub fn update(
        &mut self,
        geo: &NotchGeometry,
        compact: bool,
        cursor: (f64, f64),
        pressed: bool,
        now: Instant,
    ) -> Option<Change> {
        if self.expanded {
            let inside = geo.card_rect().inflate(CLOSE_MARGIN).contains(cursor);
            if inside {
                self.since = None;
                return None;
            }
            let since = *self.since.get_or_insert(now);
            if now.duration_since(since) >= CLOSE_DWELL {
                self.expanded = false;
                self.since = None;
                return Some(Change::Collapse);
            }
            return None;
        }

        if !geo.hot_rect(compact).contains(cursor) {
            self.since = None;
            return None;
        }
        // A click on the notch opens it at once.
        let since = *self.since.get_or_insert(now);
        if pressed || now.duration_since(since) >= OPEN_DWELL {
            self.expanded = true;
            self.since = None;
            return Some(Change::Expand);
        }
        None
    }

    pub fn fold(&mut self) {
        self.expanded = false;
        self.since = None;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The built-in display of a 14 inch MacBook Pro at its default scaling.
    fn laptop() -> NotchGeometry {
        NotchGeometry::from_screen(
            Rect { x: 0.0, y: 0.0, w: 1800.0, h: 1169.0 },
            38.0,
            Rect { x: 0.0, y: 1131.0, w: 791.0, h: 38.0 },
            Rect { x: 1012.0, y: 1131.0, w: 788.0, h: 38.0 },
        )
        .unwrap()
    }

    #[test]
    fn finds_the_notch_between_the_two_menu_bar_areas() {
        let geo = laptop();
        assert_eq!(geo.notch_x, 791.0);
        assert_eq!(geo.notch_w, 221.0);
        assert_eq!(geo.notch_h, 38.0);
        assert_eq!(geo.center_x(), 901.5);
        assert_eq!(geo.top(), 1169.0);
    }

    #[test]
    fn a_screen_without_a_notch_has_none() {
        let flat = NotchGeometry::from_screen(
            Rect { x: 1800.0, y: 0.0, w: 1920.0, h: 1080.0 },
            0.0,
            Rect { x: 0.0, y: 0.0, w: 0.0, h: 0.0 },
            Rect { x: 0.0, y: 0.0, w: 0.0, h: 0.0 },
        );
        assert_eq!(flat, None);
    }

    #[test]
    fn a_notch_with_no_gap_is_ignored() {
        let odd = NotchGeometry::from_screen(
            Rect { x: 0.0, y: 0.0, w: 1800.0, h: 1169.0 },
            38.0,
            Rect { x: 0.0, y: 1131.0, w: 900.0, h: 38.0 },
            Rect { x: 900.0, y: 1131.0, w: 900.0, h: 38.0 },
        );
        assert_eq!(odd, None);
    }

    #[test]
    fn the_window_hangs_from_the_top_edge_centred_on_the_notch() {
        let frame = laptop().window_frame();
        assert_eq!(frame.w, WINDOW_W);
        assert_eq!(frame.x + frame.w / 2.0, 901.5);
        assert_eq!(frame.y + frame.h, 1169.0);
    }

    #[test]
    fn the_hot_zone_covers_the_notch_and_a_little_more() {
        let geo = laptop();
        let hot = geo.hot_rect(false);
        assert!(hot.contains((901.5, 1160.0)));
        assert!(hot.contains((901.5, 1169.0)));
        assert!(hot.contains((785.0, 1150.0)));
        assert!(!hot.contains((700.0, 1150.0)));
        assert!(!hot.contains((901.5, 1100.0)));
    }

    #[test]
    fn the_compact_island_reaches_out_over_both_strips() {
        let geo = laptop();
        let wide = geo.hot_rect(true);
        let narrow = geo.hot_rect(false);
        assert_eq!(wide.w, 221.0 + 2.0 * EAR_W);
        assert!(wide.contains((791.0 - 60.0, 1150.0)));
        assert!(!narrow.contains((791.0 - 60.0, 1150.0)));
        assert!(wide.contains((901.5, 1150.0)));
    }

    #[test]
    fn the_compact_island_hangs_below_the_notch() {
        let geo = laptop();
        let below = (901.5, 1169.0 - 38.0 - 20.0);
        assert!(geo.hot_rect(true).contains(below));
        assert!(!geo.hot_rect(false).contains(below));
        let past = (901.5, 1169.0 - 38.0 - COMPACT_DROP - 10.0);
        assert!(!geo.hot_rect(true).contains(past));
    }

    #[test]
    fn resting_on_a_strip_opens_the_compact_island_only() {
        let geo = laptop();
        let on_strip = (791.0 - 40.0, 1150.0);
        let t0 = Instant::now();
        let mut flat = Hover::default();
        flat.update(&geo, false, on_strip, false, t0);
        assert_eq!(flat.update(&geo, false, on_strip, false, t0 + Duration::from_millis(300)), None);
        let mut compact = Hover::default();
        compact.update(&geo, true, on_strip, false, t0);
        assert_eq!(
            compact.update(&geo, true, on_strip, false, t0 + Duration::from_millis(300)),
            Some(Change::Expand)
        );
    }

    #[test]
    fn the_panel_opens_under_the_notch_and_stays_on_screen() {
        let geo = laptop();
        let (x, top) = geo.panel_top_left(340.0);
        assert_eq!(x, 901.5 - 170.0);
        assert_eq!(top, 1169.0 - 38.0 - 8.0);

        let narrow = NotchGeometry::from_screen(
            Rect { x: 0.0, y: 0.0, w: 400.0, h: 300.0 },
            30.0,
            Rect { x: 0.0, y: 270.0, w: 100.0, h: 30.0 },
            Rect { x: 140.0, y: 270.0, w: 260.0, h: 30.0 },
        )
        .unwrap();
        let (x, _) = narrow.panel_top_left(340.0);
        assert!(x >= 8.0 && x + 340.0 <= 392.0);
    }

    #[test]
    fn opens_only_after_the_pointer_rests() {
        let geo = laptop();
        let mut hover = Hover::default();
        let t0 = Instant::now();
        let on_notch = (901.5, 1160.0);
        assert_eq!(hover.update(&geo, false, on_notch, false, t0), None);
        assert_eq!(hover.update(&geo, false, on_notch, false, t0 + Duration::from_millis(60)), None);
        assert_eq!(
            hover.update(&geo, false, on_notch, false, t0 + Duration::from_millis(120)),
            Some(Change::Expand)
        );
        assert!(hover.expanded);
    }

    #[test]
    fn a_pass_over_the_notch_does_not_open_it() {
        let geo = laptop();
        let mut hover = Hover::default();
        let t0 = Instant::now();
        hover.update(&geo, false, (901.5, 1160.0), false, t0);
        hover.update(&geo, false, (400.0, 1160.0), false, t0 + Duration::from_millis(60));
        assert_eq!(
            hover.update(&geo, false, (901.5, 1160.0), false, t0 + Duration::from_millis(130)),
            None
        );
        assert!(!hover.expanded);
    }

    #[test]
    fn a_click_opens_at_once() {
        let geo = laptop();
        let mut hover = Hover::default();
        assert_eq!(
            hover.update(&geo, false, (901.5, 1160.0), true, Instant::now()),
            Some(Change::Expand)
        );
    }

    #[test]
    fn folds_only_after_the_pointer_has_stayed_away() {
        let geo = laptop();
        let mut hover = Hover::default();
        let t0 = Instant::now();
        hover.update(&geo, false, (901.5, 1160.0), true, t0);
        assert!(hover.expanded);

        let away = (100.0, 500.0);
        assert_eq!(hover.update(&geo, false, away, false, t0 + Duration::from_millis(10)), None);
        // Back inside before the dwell is up: stays open.
        assert_eq!(hover.update(&geo, false, (901.5, 1100.0), false, t0 + Duration::from_millis(200)), None);
        assert_eq!(hover.update(&geo, false, away, false, t0 + Duration::from_millis(210)), None);
        assert_eq!(
            hover.update(&geo, false, away, false, t0 + Duration::from_millis(520)),
            Some(Change::Collapse)
        );
        assert!(!hover.expanded);
    }

    #[test]
    fn the_open_card_keeps_a_margin_around_it() {
        let geo = laptop();
        let card = geo.card_rect();
        let mut hover = Hover::default();
        let t0 = Instant::now();
        hover.update(&geo, false, (901.5, 1160.0), true, t0);
        // Just past the card edge, inside the margin.
        let near = (card.x - 6.0, card.y + 60.0);
        hover.update(&geo, false, near, false, t0 + Duration::from_millis(10));
        assert_eq!(hover.update(&geo, false, near, false, t0 + Duration::from_millis(900)), None);
        assert!(hover.expanded);
    }
}

#[cfg(target_os = "macos")]
pub use mac::{info, install, is_compact, is_enabled, open_panel_under_notch, set_compact, set_enabled};

#[cfg(target_os = "macos")]
mod mac {
    use super::*;
    use objc2::MainThreadMarker;
    use objc2_app_kit::{
        NSEvent, NSMainMenuWindowLevel, NSScreen, NSWindow, NSWindowCollectionBehavior,
    };
    use objc2_foundation::{NSPoint, NSRect, NSSize};
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::{Arc, Mutex};
    use std::thread;
    use crate::settings::SettingsStore;
    use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

    pub const LABEL: &str = "notch";

    /// Shared between the page's commands, the tray menu and the pointer thread.
    pub struct NotchState {
        enabled: AtomicBool,
        /// Show the countdown and Ember beside the notch while folded.
        compact: AtomicBool,
        geometry: Mutex<Option<NotchGeometry>>,
        /// Set when something else (the full panel opening) wants the card folded now.
        fold_request: AtomicBool,
    }

    fn rect(r: NSRect) -> Rect {
        Rect {
            x: r.origin.x,
            y: r.origin.y,
            w: r.size.width,
            h: r.size.height,
        }
    }

    /// The first screen with a notch. Must run on the main thread.
    fn detect(mtm: MainThreadMarker) -> Option<NotchGeometry> {
        let screens = NSScreen::screens(mtm);
        screens.iter().find_map(|screen| {
            NotchGeometry::from_screen(
                rect(screen.frame()),
                screen.safeAreaInsets().top,
                rect(screen.auxiliaryTopLeftArea()),
                rect(screen.auxiliaryTopRightArea()),
            )
        })
    }

    /// Width and height of the hardware notch in points, and whether the compact view is on, for
    /// the page to draw around it.
    pub fn info(app: &AppHandle) -> Option<(f64, f64, bool)> {
        let state = app.try_state::<Arc<NotchState>>()?;
        let geo = (*state.geometry.lock().unwrap())?;
        Some((geo.notch_w, geo.notch_h, state.compact.load(Ordering::Relaxed)))
    }

    pub fn is_enabled(app: &AppHandle) -> bool {
        app.try_state::<Arc<NotchState>>()
            .map(|state| state.enabled.load(Ordering::Relaxed))
            .unwrap_or(false)
    }

    pub fn set_enabled(app: &AppHandle, enabled: bool) {
        if let Some(state) = app.try_state::<Arc<NotchState>>() {
            state.enabled.store(enabled, Ordering::Relaxed);
        }
        app.state::<SettingsStore>().update(|s| s.notch = enabled);
    }

    pub fn is_compact(app: &AppHandle) -> bool {
        app.try_state::<Arc<NotchState>>()
            .map(|state| state.compact.load(Ordering::Relaxed))
            .unwrap_or(false)
    }

    /// Turn the countdown beside the notch on or off, and tell the island page.
    pub fn set_compact(app: &AppHandle, compact: bool) {
        if let Some(state) = app.try_state::<Arc<NotchState>>() {
            state.compact.store(compact, Ordering::Relaxed);
        }
        app.state::<SettingsStore>().update(|s| s.compact = compact);
        let _ = app.emit_to(LABEL, "notch://compact", compact);
    }

    /// Above the menu bar, on every Space, over full screen apps, no shadow, no window cycling.
    fn float_over_menu_bar(window: &WebviewWindow, frame: Rect) {
        let Ok(ptr) = window.ns_window() else { return };
        // SAFETY: Tauri hands back the live NSWindow of this webview window, and this runs on
        // the main thread.
        let ns: &NSWindow = unsafe { &*(ptr as *const NSWindow) };
        ns.setLevel(NSMainMenuWindowLevel + 3);
        ns.setCollectionBehavior(
            NSWindowCollectionBehavior::CanJoinAllSpaces
                | NSWindowCollectionBehavior::Stationary
                | NSWindowCollectionBehavior::FullScreenAuxiliary
                | NSWindowCollectionBehavior::IgnoresCycle,
        );
        ns.setHasShadow(false);
        place(ns, frame);
    }

    fn place(ns: &NSWindow, frame: Rect) {
        ns.setFrame_display(
            NSRect::new(
                NSPoint::new(frame.x, frame.y),
                NSSize::new(frame.w, frame.h),
            ),
            true,
        );
    }

    /// Builds the island window and starts watching the pointer. Returns whether this Mac has a
    /// notch. Call from `setup`, which runs on the main thread.
    pub fn install(app: &mut tauri::App) -> bool {
        let Some(mtm) = MainThreadMarker::new() else {
            return false;
        };
        let geometry = detect(mtm);
        let prefs = app.state::<SettingsStore>().get();
        let state = Arc::new(NotchState {
            enabled: AtomicBool::new(prefs.notch),
            compact: AtomicBool::new(prefs.compact),
            geometry: Mutex::new(geometry),
            fold_request: AtomicBool::new(false),
        });
        app.manage(state.clone());
        let Some(geo) = geometry else {
            return false;
        };

        let window = match WebviewWindowBuilder::new(
            app,
            LABEL,
            WebviewUrl::App("index.html?view=notch".into()),
        )
        .title("UNTIL notch")
        .inner_size(WINDOW_W, WINDOW_H)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .resizable(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .visible_on_all_workspaces(true)
        .focused(false)
        .focusable(false)
        .accept_first_mouse(true)
        .visible(false)
        .build()
        {
            Ok(window) => window,
            Err(_) => return false,
        };

        float_over_menu_bar(&window, geo.window_frame());
        let _ = window.set_ignore_cursor_events(true);
        if state.enabled.load(Ordering::Relaxed) {
            let _ = window.show();
        }

        watch_pointer(app.handle().clone(), state);
        true
    }

    fn watch_pointer(app: AppHandle, state: Arc<NotchState>) {
        thread::spawn(move || {
            let mut hover = Hover::default();
            let mut ticks: u32 = 0;
            let mut ignore_again_at: Option<Instant> = None;
            let mut shown = state.enabled.load(Ordering::Relaxed);
            loop {
                thread::sleep(Duration::from_millis(33));
                ticks = ticks.wrapping_add(1);
                let Some(window) = app.get_webview_window(LABEL) else {
                    return;
                };

                // A display can come and go (lid, cable). Look again now and then, on the main thread.
                if ticks % 45 == 0 {
                    refresh_geometry(&app, &state);
                }

                let enabled = state.enabled.load(Ordering::Relaxed);
                let geo = *state.geometry.lock().unwrap();
                let visible = enabled && geo.is_some();
                if visible != shown {
                    shown = visible;
                    if visible {
                        let _ = window.show();
                    } else {
                        hover.fold();
                        let _ = app.emit_to(LABEL, "notch://state", false);
                        let _ = window.hide();
                    }
                }
                let Some(geo) = geo.filter(|_| visible) else {
                    continue;
                };

                if state.fold_request.swap(false, Ordering::Relaxed) && hover.expanded {
                    hover.fold();
                    let _ = app.emit_to(LABEL, "notch://state", false);
                    ignore_again_at = Some(Instant::now() + Duration::from_millis(420));
                }

                let p = NSEvent::mouseLocation();
                let pressed = NSEvent::pressedMouseButtons() & 1 == 1;
                let now = Instant::now();
                let compact = state.compact.load(Ordering::Relaxed);
                let change = hover.update(&geo, compact, (p.x, p.y), pressed, now);
                match change {
                    Some(Change::Expand) => {
                        ignore_again_at = None;
                        let _ = window.set_ignore_cursor_events(false);
                        let _ = app.emit_to(LABEL, "notch://state", true);
                    }
                    Some(Change::Collapse) => {
                        let _ = app.emit_to(LABEL, "notch://state", false);
                        ignore_again_at = Some(now + Duration::from_millis(420));
                    }
                    None => {}
                }
                if let Some(at) = ignore_again_at {
                    if now >= at && !hover.expanded {
                        let _ = window.set_ignore_cursor_events(true);
                        ignore_again_at = None;
                    }
                }
            }
        });
    }

    fn refresh_geometry(app: &AppHandle, state: &Arc<NotchState>) {
        let state = state.clone();
        let handle = app.clone();
        let _ = app.run_on_main_thread(move || {
            let Some(mtm) = MainThreadMarker::new() else {
                return;
            };
            let next = detect(mtm);
            let mut current = state.geometry.lock().unwrap();
            if *current == next {
                return;
            }
            *current = next;
            drop(current);
            if let (Some(geo), Some(window)) = (next, handle.get_webview_window(LABEL)) {
                float_over_menu_bar(&window, geo.window_frame());
            }
        });
    }

    /// Opens the full panel under the notch. Used by the island's button. The position is set on
    /// the NSWindow in Cocoa coordinates, so it is exact on any mix of displays.
    pub fn open_panel_under_notch(app: &AppHandle, panel_label: &str) {
        let Some(state) = app.try_state::<Arc<NotchState>>() else {
            return;
        };
        let geo = *state.geometry.lock().unwrap();
        state.fold_request.store(true, Ordering::Relaxed);
        let handle = app.clone();
        let label = panel_label.to_string();
        let _ = app.run_on_main_thread(move || {
            let Some(panel) = handle.get_webview_window(&label) else {
                return;
            };
            if let (Some(geo), Ok(ptr)) = (geo, panel.ns_window()) {
                // SAFETY: the live NSWindow of the panel, on the main thread.
                let ns: &NSWindow = unsafe { &*(ptr as *const NSWindow) };
                let width = ns.frame().size.width;
                let (x, top) = geo.panel_top_left(width);
                ns.setFrameTopLeftPoint(NSPoint::new(x, top));
            }
            let _ = panel.show();
            let _ = panel.set_focus();
        });
    }
}
