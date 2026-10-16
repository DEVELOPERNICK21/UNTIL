use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{
    image::Image,
    menu::{CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, PhysicalPosition, Rect, Runtime, WebviewWindow, WindowEvent,
};

mod notch;
mod oauth;
mod ring;
mod settings;
mod smoke;
mod widgets;

const TRAY_ID: &str = "until-extra";
const PANEL: &str = "panel";
const PANEL_GAP: f64 = 6.0;
const SCREEN_MARGIN: f64 = 8.0;

#[cfg(target_os = "macos")]
const RING_PX: u32 = 36;
#[cfg(not(target_os = "macos"))]
const RING_PX: u32 = 32;

/// When the panel last hid because it lost focus. Clicking the tray icon to
/// close an open panel first blurs it; without this the click would reopen it.
#[derive(Default)]
struct PanelState {
    blurred_at: Mutex<Option<Instant>>,
}

pub(crate) fn show_panel<R: Runtime>(app: &AppHandle<R>) {
    if let Some(panel) = app.get_webview_window(PANEL) {
        let _ = panel.show();
        let _ = panel.set_focus();
    }
}

/// Drops the panel below the menu bar icon (Mac, top-edge taskbars) or above
/// the tray icon (Windows bottom taskbar), kept inside the screen.
fn place_panel<R: Runtime>(panel: &WebviewWindow<R>, icon: &Rect) {
    let Ok(Some(monitor)) = panel.current_monitor() else {
        return;
    };
    let scale = monitor.scale_factor();
    let pos = icon.position.to_physical::<f64>(scale);
    let size = icon.size.to_physical::<f64>(scale);
    let Ok(win) = panel.outer_size() else {
        return;
    };
    let (win_w, win_h) = (win.width as f64, win.height as f64);
    let screen_pos = monitor.position();
    let screen = monitor.size();
    let (left, top) = (screen_pos.x as f64, screen_pos.y as f64);
    let (right, bottom) = (left + screen.width as f64, top + screen.height as f64);
    let margin = SCREEN_MARGIN * scale;
    let gap = PANEL_GAP * scale;

    let x = (pos.x + size.width / 2.0 - win_w / 2.0).clamp(left + margin, right - win_w - margin);
    let icon_in_top_half = pos.y < top + (bottom - top) / 2.0;
    let y = if icon_in_top_half {
        pos.y + size.height + gap
    } else {
        pos.y - win_h - gap
    };
    let _ = panel.set_position(PhysicalPosition::new(x.round() as i32, y.round() as i32));
}

fn on_tray_click<R: Runtime>(app: &AppHandle<R>, icon: &Rect) {
    let Some(panel) = app.get_webview_window(PANEL) else {
        return;
    };
    let just_blurred = app
        .state::<PanelState>()
        .blurred_at
        .lock()
        .ok()
        .and_then(|t| *t)
        .is_some_and(|t| t.elapsed() < Duration::from_millis(250));
    if just_blurred {
        return;
    }
    if panel.is_visible().unwrap_or(false) {
        let _ = panel.hide();
    } else {
        place_panel(&panel, icon);
        let _ = panel.show();
        let _ = panel.set_focus();
    }
}

/// Mac: template ring + `text` as the menu bar title. Windows: colored ring,
/// `text` as tooltip (the tray has no text).
#[tauri::command]
fn set_extra(
    app: AppHandle,
    text: String,
    progress: Option<f64>,
    color: Option<String>,
) -> Result<(), String> {
    let tray = app.tray_by_id(TRAY_ID).ok_or("missing tray")?;
    tray.set_tooltip(Some(format!("UNTIL · {text}")))
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    {
        let _ = color;
        let pixels = ring::draw(RING_PX, progress, &ring::TEMPLATE);
        tray.set_icon(Some(Image::new_owned(pixels, RING_PX, RING_PX)))
            .map_err(|e| e.to_string())?;
        tray.set_icon_as_template(true).map_err(|e| e.to_string())?;
        tray.set_title(Some(&text)).map_err(|e| e.to_string())?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        let fill = color
            .as_deref()
            .and_then(ring::parse_hex)
            .unwrap_or([237, 237, 237]);
        let pixels = ring::draw(RING_PX, progress, &ring::colored(fill));
        tray.set_icon(Some(Image::new_owned(pixels, RING_PX, RING_PX)))
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// A page tells us it has loaded and run (see `smoke::PagesReady`). The window is the caller.
#[tauri::command]
fn page_ready(window: tauri::Window, ready: tauri::State<smoke::PagesReady>) {
    ready.mark(window.label());
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

/// Esc closes the panel, the way a menu bar popover or tray flyout does. Focus goes back to
/// whatever window was in front before.
#[tauri::command]
fn hide_panel(app: AppHandle) {
    if let Some(panel) = app.get_webview_window(PANEL) {
        let _ = panel.hide();
    }
}

#[derive(serde::Serialize)]
struct NotchInfo {
    width: f64,
    height: f64,
    compact: bool,
}

/// Size of this Mac's notch, so the island can be drawn around it. `None` where there is none.
#[tauri::command]
fn notch_info(app: AppHandle) -> Option<NotchInfo> {
    #[cfg(any(target_os = "macos", windows))]
    {
        notch::info(&app).map(|(width, height, compact)| NotchInfo {
            width,
            height,
            compact,
        })
    }
    #[cfg(not(any(target_os = "macos", windows)))]
    {
        let _ = app;
        None
    }
}

/// The island's button: open the full panel, under the notch where there is one.
#[tauri::command]
fn notch_open_panel(app: AppHandle) {
    #[cfg(any(target_os = "macos", windows))]
    notch::open_panel_under_notch(&app, PANEL);
    #[cfg(not(any(target_os = "macos", windows)))]
    show_panel(&app);
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct WidgetsState {
    day: bool,
    month: bool,
    year: bool,
    life: bool,
    on_top: bool,
}

/// Which desktop widgets are on, for the switches in the panel.
#[tauri::command]
fn widgets_state(app: AppHandle) -> WidgetsState {
    WidgetsState {
        day: widgets::is_open(&app, "day"),
        month: widgets::is_open(&app, "month"),
        year: widgets::is_open(&app, "year"),
        life: widgets::is_open(&app, "life"),
        on_top: widgets::is_on_top(&app),
    }
}

/// Turn a widget on or off from the panel. Turning one on raises it above your windows for a few
/// seconds so you can see where it went.
///
/// This is `async` on purpose. It can create a window, and on Windows creating a window from a
/// synchronous command (which runs on the main thread) deadlocks.
#[tauri::command]
async fn widget_set_open(app: AppHandle, kind: String, on: bool) {
    widgets::set_open(&app, &kind, on);
}

#[tauri::command]
fn widgets_set_on_top(app: AppHandle, on: bool) {
    widgets::set_on_top(&app, on);
}

#[tauri::command]
fn widgets_peek(app: AppHandle) {
    widgets::peek(&app);
}

/// A widget's own buttons: change its size.
#[tauri::command]
fn widget_set_size(app: AppHandle, kind: String, size: String) {
    widgets::set_size(&app, &kind, &size);
}

/// A widget's own buttons: close it. It stays off until ticked again in the tray menu.
#[tauri::command]
fn widget_close(app: AppHandle, kind: String) {
    widgets::set_open(&app, &kind, false);
}

/// A widget's own buttons: open the full panel, under the menu bar icon.
#[tauri::command]
fn widget_open_panel(app: AppHandle) {
    let (Some(panel), Some(tray)) = (app.get_webview_window(PANEL), app.tray_by_id(TRAY_ID)) else {
        return show_panel(&app);
    };
    if let Ok(Some(rect)) = tray.rect() {
        place_panel(&panel, &rect);
    }
    let _ = panel.show();
    let _ = panel.set_focus();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // Must be the first plugin. A second launch (including an until-desktop://
    // link on Windows) is forwarded here and the deep-link plugin re-emits it.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
        show_panel(app);
    }));

    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ));

    builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .manage(PanelState::default())
        .manage(smoke::PagesReady::default())
        .manage(widgets::TrayWidgets::default())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Always dark, whatever the system setting is: the panel, the island and the widgets
            // are designed for it, and the native menus and window edges should match.
            app.set_theme(Some(tauri::Theme::Dark));

            // Mac registers the scheme from the bundle's Info.plist; Windows and
            // Linux dev builds register at runtime.
            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                let handle = app.handle().clone();
                app.deep_link().on_open_url(move |_event| show_panel(&handle));
            }

            app.manage(settings::SettingsStore::load(app.handle()));

            // Macs with a notch get the island, and so does Windows: a pill at the top of the main
            // screen. Other Macs and Linux never build it.
            #[cfg(any(target_os = "macos", windows))]
            let has_notch = notch::install(app);
            #[cfg(not(any(target_os = "macos", windows)))]
            let has_notch = false;

            let quit = MenuItemBuilder::with_id("quit", "Quit UNTIL").build(app)?;
            let prefs = app.state::<settings::SettingsStore>().get();

            // The island's two tick boxes only exist where the island does.
            #[cfg(windows)]
            let (island_label, compact_label) = ("Show the island", "Show time beside the island");
            #[cfg(not(windows))]
            let (island_label, compact_label) = ("Show in the notch", "Show time beside the notch");
            let notch_items = if has_notch {
                Some((
                    CheckMenuItemBuilder::with_id("notch", island_label)
                        .checked(prefs.notch)
                        .build(app)?,
                    CheckMenuItemBuilder::with_id("compact", compact_label)
                        .checked(prefs.compact)
                        .build(app)?,
                ))
            } else {
                None
            };

            // One tick box per desktop widget. Closing a widget from its own page unticks it.
            let mut widgets_menu = SubmenuBuilder::new(app, "Widgets");
            for kind in widgets::KINDS {
                let on = prefs.widgets.get(kind).is_some_and(|w| w.on);
                let item = CheckMenuItemBuilder::with_id(format!("widget:{kind}"), widgets::label(kind))
                    .checked(on)
                    .build(app)?;
                widgets_menu = widgets_menu.item(&item);
                app.state::<widgets::TrayWidgets>()
                    .0
                    .lock()
                    .unwrap()
                    .insert(kind.to_string(), item);
            }
            let widgets_on_top = CheckMenuItemBuilder::with_id("widgets:ontop", "Keep widgets on top")
                .checked(prefs.widgets_on_top)
                .build(app)?;
            app.state::<widgets::TrayWidgets>()
                .0
                .lock()
                .unwrap()
                .insert(widgets::ON_TOP_ITEM.to_string(), widgets_on_top.clone());
            let widgets_menu = widgets_menu
                .separator()
                .item(&MenuItemBuilder::with_id("widgets:peek", "Show widgets now").build(app)?)
                .item(&widgets_on_top)
                .build()?;

            let mut menu = MenuBuilder::new(app);
            if let Some((notch_item, compact_item)) = &notch_items {
                menu = menu.item(notch_item).item(compact_item).separator();
            }
            let menu = menu.item(&widgets_menu).separator().item(&quit).build()?;

            #[cfg(target_os = "macos")]
            let track = ring::draw(RING_PX, None, &ring::TEMPLATE);
            #[cfg(not(target_os = "macos"))]
            let track = ring::draw(RING_PX, None, &ring::colored([237, 237, 237]));
            let builder = TrayIconBuilder::with_id(TRAY_ID)
                .icon(Image::new_owned(track, RING_PX, RING_PX))
                .tooltip("UNTIL")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    let id = event.id().as_ref();
                    if id == "quit" {
                        app.exit(0);
                    } else if id == "widgets:peek" {
                        widgets::peek(app);
                    } else if id == "widgets:ontop" {
                        let on = !widgets::is_on_top(app);
                        widgets::set_on_top(app, on);
                    } else if let Some(kind) = id.strip_prefix("widget:") {
                        // Menu events arrive on the main thread, and creating a window there
                        // deadlocks on Windows, so hand it to another thread.
                        let (app, kind) = (app.clone(), kind.to_string());
                        std::thread::spawn(move || {
                            let on = !widgets::is_open(&app, &kind);
                            widgets::set_open(&app, &kind, on);
                        });
                    } else if id == "notch" || id == "compact" {
                        #[cfg(any(target_os = "macos", windows))]
                        if let Some((notch_item, compact_item)) = &notch_items {
                            if id == "notch" {
                                let on = !notch::is_enabled(app);
                                notch::set_enabled(app, on);
                                let _ = notch_item.set_checked(on);
                            } else {
                                let on = !notch::is_compact(app);
                                notch::set_compact(app, on);
                                let _ = compact_item.set_checked(on);
                            }
                        }
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        rect,
                        ..
                    } = event
                    {
                        on_tray_click(tray.app_handle(), &rect);
                    }
                });

            #[cfg(target_os = "macos")]
            let builder = builder.icon_as_template(true).title("—");

            builder.build(app)?;

            widgets::restore(app.handle());
            widgets::start_flush_thread(app.handle().clone());
            smoke::maybe_run(app.handle().clone());
            Ok(())
        })
        .on_window_event(|window, event| match event {
            // Closing a window only hides it. A widget is switched off by its own close button or
            // the menu, never here: the app quitting closes every window and must not forget which
            // widgets were on.
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                let _ = window.hide();
            }
            WindowEvent::Moved(position) if widgets::kind_of(window.label()).is_some() => {
                widgets::moved(window.app_handle(), window, *position);
            }
            WindowEvent::Focused(false) if window.label() == PANEL => {
                // Wait a beat before hiding. Dragging the borderless panel on Windows can blur
                // it for a moment; closing immediately made it feel stuck to the tray.
                if let Ok(mut at) = window.state::<PanelState>().blurred_at.lock() {
                    *at = Some(Instant::now());
                }
                let app = window.app_handle().clone();
                std::thread::spawn(move || {
                    std::thread::sleep(Duration::from_millis(220));
                    let Some(panel) = app.get_webview_window(PANEL) else {
                        return;
                    };
                    if panel.is_focused().unwrap_or(false) {
                        return;
                    }
                    let _ = panel.hide();
                });
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            set_extra,
            quit_app,
            hide_panel,
            page_ready,
            notch_info,
            notch_open_panel,
            widget_set_size,
            widget_close,
            widget_open_panel,
            widgets_state,
            widget_set_open,
            widgets_set_on_top,
            widgets_peek,
            oauth::oauth_loopback_start,
            oauth::google_exchange_code
        ])
        .run(tauri::generate_context!())
        .expect("error while running UNTIL desktop");
}
