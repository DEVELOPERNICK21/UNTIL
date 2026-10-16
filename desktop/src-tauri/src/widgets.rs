//! Desktop widgets: the phone's Day, Month, Year and Life widgets as small windows that sit on the
//! desktop, below your other windows. Drag one to move it. Which are on, their size and where they
//! sit is remembered. The page draws them (`?view=widget&kind=day`).

use std::collections::HashMap;
use std::sync::Mutex;

use tauri::menu::CheckMenuItem;
use tauri::{
    AppHandle, Manager, PhysicalPosition, Wry, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};

use crate::settings::SettingsStore;

pub const KINDS: [&str; 4] = ["day", "month", "year", "life"];

/// The key the "Keep widgets on top" tick box is stored under in `TrayWidgets`.
pub const ON_TOP_ITEM: &str = "ontop";

/// The sizes of the iPhone's small (158 x 158) and medium (338 x 158) widgets, in points.
const SMALL: (f64, f64) = (158.0, 158.0);
const MEDIUM: (f64, f64) = (338.0, 158.0);
const MARGIN: f64 = 24.0;
const MENU_BAR: f64 = 56.0;
const GAP: f64 = 16.0;

pub fn label(kind: &str) -> &'static str {
    match kind {
        "day" => "Today",
        "month" => "Month",
        "year" => "Year",
        "life" => "Life",
        _ => "",
    }
}

pub fn window_label(kind: &str) -> String {
    format!("widget-{kind}")
}

pub fn kind_of(window_label: &str) -> Option<&str> {
    window_label
        .strip_prefix("widget-")
        .filter(|kind| KINDS.contains(kind))
}

/// Only the Day widget has two sizes. The others are always medium.
pub fn size_for<'a>(kind: &str, wanted: &'a str) -> &'a str {
    if kind == "day" {
        if wanted == "medium" {
            "medium"
        } else {
            "small"
        }
    } else {
        "medium"
    }
}

pub fn dimensions(kind: &str, size: &str) -> (f64, f64) {
    if size_for(kind, size) == "small" {
        SMALL
    } else {
        MEDIUM
    }
}

/// Where a widget goes the first time: down the right edge, one under the other.
pub fn default_position(screen: (f64, f64, f64, f64), slot: usize, size: (f64, f64)) -> (f64, f64) {
    let (x, y, w, _h) = screen;
    (
        x + w - size.0 - MARGIN,
        y + MENU_BAR + slot as f64 * (SMALL.1 + GAP),
    )
}

/// The tray's check items for each widget, so closing a widget from its own page unticks it.
#[derive(Default)]
pub struct TrayWidgets(pub Mutex<HashMap<String, CheckMenuItem<Wry>>>);

fn store(app: &AppHandle) -> tauri::State<'_, SettingsStore> {
    app.state::<SettingsStore>()
}

fn primary_screen(app: &AppHandle) -> (f64, f64, f64, f64) {
    app.primary_monitor()
        .ok()
        .flatten()
        .map(|m| {
            let scale = m.scale_factor();
            let pos = m.position();
            let size = m.size();
            (
                pos.x as f64 / scale,
                pos.y as f64 / scale,
                size.width as f64 / scale,
                size.height as f64 / scale,
            )
        })
        .unwrap_or((0.0, 0.0, 1440.0, 900.0))
}

/// Put a widget window on the desktop, behind everything, or above other windows.
fn set_level(window: &WebviewWindow, on_top: bool) {
    if on_top {
        let _ = window.set_always_on_bottom(false);
        let _ = window.set_always_on_top(true);
    } else {
        let _ = window.set_always_on_top(false);
        let _ = window.set_always_on_bottom(true);
    }
}

fn open_windows(app: &AppHandle) -> Vec<WebviewWindow> {
    KINDS
        .iter()
        .filter_map(|kind| app.get_webview_window(&window_label(kind)))
        .filter(|window| window.is_visible().unwrap_or(false))
        .collect()
}

pub fn is_on_top(app: &AppHandle) -> bool {
    store(app).get().widgets_on_top
}

/// Keep the widgets above other windows (or send them back to the desktop), and remember it.
pub fn set_on_top(app: &AppHandle, on_top: bool) {
    store(app).update(|s| s.widgets_on_top = on_top);
    for window in open_windows(app) {
        set_level(&window, on_top);
    }
    if let Some(item) = app.state::<TrayWidgets>().0.lock().unwrap().get(ON_TOP_ITEM) {
        let _ = item.set_checked(on_top);
    }
}

/// Raise every open widget above your other windows for a few seconds, so you can see them,
/// then put them back where they were.
pub fn peek(app: &AppHandle) {
    let windows = open_windows(app);
    for window in &windows {
        set_level(window, true);
    }
    if is_on_top(app) {
        return;
    }
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_secs(6));
        for window in &windows {
            set_level(window, false);
        }
    });
}

fn build(app: &AppHandle, kind: &str) -> Option<WebviewWindow> {
    let pref = store(app).get().widgets.get(kind).cloned().unwrap_or_default();
    let size = size_for(kind, &pref.size);
    let dims = dimensions(kind, size);
    let slot = KINDS.iter().position(|k| *k == kind).unwrap_or(0);
    let (x, y) = match (pref.x, pref.y) {
        (Some(x), Some(y)) => (x, y),
        _ => default_position(primary_screen(app), slot, dims),
    };
    let on_top = store(app).get().widgets_on_top;
    let builder = WebviewWindowBuilder::new(
        app,
        window_label(kind),
        WebviewUrl::App(format!("index.html?view=widget&kind={kind}&size={size}").into()),
    )
    .title(format!("UNTIL {}", label(kind)))
    .inner_size(dims.0, dims.1)
    .position(x, y)
    .decorations(false)
    .transparent(true)
    .shadow(true)
    .resizable(false)
    .skip_taskbar(true)
    .visible_on_all_workspaces(true)
    .focused(false)
    .accept_first_mouse(true)
    .theme(Some(tauri::Theme::Dark));
    // Only one of the two: asking for both makes the second cancel the first.
    let builder = if on_top {
        builder.always_on_top(true)
    } else {
        builder.always_on_bottom(true)
    };
    builder.build().ok()
}

/// Turn a widget on or off, remember it, and tick or untick it in the tray menu.
pub fn set_open(app: &AppHandle, kind: &str, on: bool) {
    if !KINDS.contains(&kind) {
        return;
    }
    let label = window_label(kind);
    if on {
        match app.get_webview_window(&label) {
            Some(window) => {
                let _ = window.show();
            }
            None => {
                build(app, kind);
            }
        }
    } else if let Some(window) = app.get_webview_window(&label) {
        let _ = window.hide();
    }
    store(app).update(|s| {
        s.widgets.entry(kind.to_string()).or_default().on = on;
    });
    if on {
        // Widgets live behind your windows, so show where this one landed.
        peek(app);
    }
    if let Some(item) = app
        .state::<TrayWidgets>()
        .0
        .lock()
        .unwrap()
        .get(kind)
    {
        let _ = item.set_checked(on);
    }
}

pub fn is_open(app: &AppHandle, kind: &str) -> bool {
    store(app).get().widgets.get(kind).is_some_and(|w| w.on)
}

/// Bring back the widgets that were on when the app last quit.
pub fn restore(app: &AppHandle) {
    for kind in KINDS {
        if is_open(app, kind) && app.get_webview_window(&window_label(kind)).is_none() {
            build(app, kind);
        }
    }
}

/// Change the size of a widget that has two, keeping its top-left corner where it is.
pub fn set_size(app: &AppHandle, kind: &str, wanted: &str) {
    let size = size_for(kind, wanted);
    let Some(window) = app.get_webview_window(&window_label(kind)) else {
        return;
    };
    let scale = window.scale_factor().unwrap_or(1.0);
    let corner = window.outer_position().ok();
    let (w, h) = dimensions(kind, size);
    let _ = window.set_size(tauri::LogicalSize::new(w, h));
    if let Some(corner) = corner {
        let _ = window.set_position(corner);
    }
    let size = size.to_string();
    store(app).update(|s| {
        let pref = s.widgets.entry(kind.to_string()).or_default();
        pref.size = size;
        if let Some(corner) = corner {
            pref.x = Some(corner.x as f64 / scale);
            pref.y = Some(corner.y as f64 / scale);
        }
    });
}

/// A widget was dragged. Keep the new place; it is written to disk a moment later.
pub fn moved(app: &AppHandle, window: &tauri::Window, position: PhysicalPosition<i32>) {
    let Some(kind) = kind_of(window.label()) else {
        return;
    };
    let scale = window.scale_factor().unwrap_or(1.0);
    store(app).update_soon(|s| {
        let pref = s.widgets.entry(kind.to_string()).or_default();
        pref.x = Some(position.x as f64 / scale);
        pref.y = Some(position.y as f64 / scale);
    });
}

/// Writes any dragged positions to disk every so often.
pub fn start_flush_thread(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(std::time::Duration::from_millis(600));
        store(&app).flush();
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn day_has_two_sizes_and_the_rest_are_medium() {
        assert_eq!(size_for("day", "medium"), "medium");
        assert_eq!(size_for("day", "small"), "small");
        assert_eq!(size_for("day", ""), "small");
        assert_eq!(size_for("month", "small"), "medium");
        assert_eq!(size_for("life", ""), "medium");
    }

    #[test]
    fn sizes_match_the_phone_widgets() {
        assert_eq!(dimensions("day", "small"), (158.0, 158.0));
        assert_eq!(dimensions("day", "medium"), (338.0, 158.0));
        assert_eq!(dimensions("year", "small"), (338.0, 158.0));
    }

    #[test]
    fn a_window_label_belongs_to_one_kind_and_back() {
        for kind in KINDS {
            assert_eq!(kind_of(&window_label(kind)), Some(kind));
        }
        assert_eq!(kind_of("panel"), None);
        assert_eq!(kind_of("widget-other"), None);
        assert_eq!(kind_of("notch"), None);
    }

    #[test]
    fn new_widgets_stack_down_the_right_edge() {
        let screen = (0.0, 0.0, 1800.0, 1169.0);
        let (x0, y0) = default_position(screen, 0, MEDIUM);
        let (x1, y1) = default_position(screen, 1, MEDIUM);
        assert_eq!(x0, 1800.0 - 338.0 - 24.0);
        assert_eq!(x0, x1);
        assert_eq!(y0, 56.0);
        assert_eq!(y1, 56.0 + 158.0 + 16.0);
    }

    #[test]
    fn a_small_widget_sits_against_the_same_edge() {
        let screen = (0.0, 0.0, 1800.0, 1169.0);
        let (x, _) = default_position(screen, 0, SMALL);
        assert_eq!(x, 1800.0 - 158.0 - 24.0);
    }
}
